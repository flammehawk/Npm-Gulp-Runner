import {
    Folder,
    Static,
    Config,
    BuildModes,
    myTaskFunktion,
    KeyedGlob,
    KeyValuePair,
    getGlobFromKeyValuePair,
    folderTypeFilter,
    MappedFolder,
    mapFolder,
    GulpStream,
} from '../lib';
import { TaskFunction, Gulp } from 'gulp';
import { pipeline } from 'stream';
import ErrnoException = NodeJS.ErrnoException;

import { FSWatcher } from 'fs';
import { BaseTask } from './BaseTask';

/**
 *
 *
 * @export
 * @class Copy
 */
export class Copy extends BaseTask<Static> {
    /**
     *Creates an instance of Copy.
     * @param {Gulp} _gulp
     * @param {Config} _config
     * @param {BuildModes} _buildMode
     * @memberof Copy
     */
    constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes) {
        super(_gulp, _buildMode);
        super.init(_config);

        this.initMappedFolder(_config);
    }

    private initMappedFolder(_config: Config): void {
        const boundMapFolder = (folder: Folder): MappedFolder<Static> =>
            mapFolder(folder, this.sources);
        this.mappedFolder = _config.Folders.filter(
            folderTypeFilter(['static'])
        ).map(boundMapFolder);
    }

    /**
     *
     *
     * @memberof Copy
     */
    public watch(): FSWatcher {
        return this._gulp.watch(this.getToWatchGlobs(), this.copy(true));
    }

    /**
     *
     *
     * @param {boolean} [watch=false]
     * @returns {TaskFunction}
     * @memberof Copy
     */
    public copy(watch = false): TaskFunction {
        const mapStaticTasks = (folder: MappedFolder<Static>): TaskFunction =>
            this.getTaskfunction(folder, watch);
        return this._gulp.parallel(...this.mappedFolder.map(mapStaticTasks));
    }

    private getTaskfunction(
        mappedFolder: MappedFolder<Static>,
        watch: boolean
    ): TaskFunction {
        return this._gulp.parallel(
            ...mappedFolder.Value.map((keyedGlob) => {
                return myTaskFunktion<void>(
                    new Promise<void>((resolve, reject) => {
                        pipeline(
                            [
                                this.getGulpSrc(mappedFolder, keyedGlob, watch),
                                this.Destination(mappedFolder.Key.Dest),
                            ],
                            this.errorCallback(reject)
                        );
                        resolve();
                    })
                );
            })
        );
    }
    private getGulpSrc(
        keyValuePair: KeyValuePair<Folder, KeyedGlob<Static>[]>,
        keyedGlob: KeyedGlob<Static>,
        watch: boolean
    ): GulpStream {
        const copyGlob = getGlobFromKeyValuePair(keyValuePair, keyedGlob.Key);
        return this._gulp.src(copyGlob, this.getOptions(watch));
    }

    protected getOptions(
        watch: boolean,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        taskFunction?: (arg0: boolean) => TaskFunction[]
    ): { sourcemaps: boolean; since?: number } {
        return watch
            ? {
                  sourcemaps: false,
                  since: this._gulp.lastRun(this.copy(true)),
              }
            : {
                  sourcemaps: false,
              };
    }

    private errorCallback(
        reject: (reason?: Error) => void
    ): (err: ErrnoException) => void {
        return (errnoException: ErrnoException): void => {
            reject(new Error(errnoException.message));
        };
    }
}
