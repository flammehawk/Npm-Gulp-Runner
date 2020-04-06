import {
    BuildModes,
    MappedFolder,
    Build,
    Source,
    Config,
    getTarget,
    findSource,
    getDestination,
    getGlobFromKeyValuePair,
    GulpStream,
} from '../lib';
import { Gulp } from 'gulp';
import { TaskFunction } from 'undertaker';

export class BaseTask<T extends Source> {
    //#region constants
    protected readonly renameOptions = { suffix: '.min' };
    //#endregion
    //#region Variables
    protected _gulp: Gulp;

    protected buildMode: BuildModes;
    protected mappedFolder: MappedFolder<T>[];
    protected target: Build;
    protected destPath: string;
    protected sources: T[];
    //#endregion
    constructor(_gulp: Gulp, _buildMode: BuildModes) {
        this._gulp = _gulp;
        this.buildMode = _buildMode;
    }

    protected init(_config: Config): void {
        this.target = getTarget(_config, this.buildMode);
    }
    protected initSources(_sourceNames: string[], _Sources: T[]): void {
        this.sources = _sourceNames
            .map((value) => _Sources.find(findSource(value)) ?? null)
            .filter((value) => value !== null);
    }
    protected Destination(folderDest: string): GulpStream {
        const destination = getDestination(
            this.target.Path,
            folderDest,
            this.destPath
        );
        return this._gulp.dest(
            destination,
            this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
        );
    }
    protected getOptions(
        watch: boolean,
        taskFunction: (arg0: boolean) => TaskFunction[]
    ): { sourcemaps: boolean; since?: number } {
        return watch
            ? {
                  sourcemaps: this.buildMode === BuildModes.dev,
                  since: this._gulp.lastRun(
                      this._gulp.parallel(taskFunction(true))
                  ),
              }
            : { sourcemaps: this.buildMode === BuildModes.dev };
    }
    protected getToWatchGlobs(): string[] {
        const retVal: string[] = [];
        this.mappedFolder.forEach((folder) => {
            this.sources.forEach((source) => {
                retVal.push(...getGlobFromKeyValuePair(folder, source));
            });
        });
        return retVal;
    }
}
