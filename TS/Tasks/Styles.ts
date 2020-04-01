import { Gulp, TaskFunction } from 'gulp';
import autoPrefixer from 'gulp-autoprefixer';
//@ts-ignore 7016
import cleanCss from 'gulp-clean-css';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import dependents from 'gulp-dependents';

import { pipeline } from 'stream';
import {
    Config,
    Folder,
    Source,
    creatGlob,
    BuildModes,
    myTaskFunktion,
    KeyedGlob,
    createKeyedGlob,
    getGlobFromKeyValuePair,
    getDestination,
    MappedFolder,
    findSource,
} from '../lib';

import through2 = require('through2');

import ErrnoException = NodeJS.ErrnoException;
import { FSWatcher } from 'fs';
import { Targets, Build } from '../lib/config';

declare const scss = 'scss';
declare const css = 'css';

/**
 *
 *
 * @export
 * @class Styles
 */
export class Styles {
    private _gulp: Gulp;
    private buildMode: BuildModes;
    private target: Build;
    private SCSS: Source | null;
    private CSS: Source | null;
    private mappedFolder: MappedFolder<Source>[];
    private DestPath: string;

    /**
     *Creates an instance of Styles.
     * @param {Gulp} _gulp
     * @param {Config} _config
     * @param {BuildModes} _buildMode
     * @memberof Styles
     */
    constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes) {
        this._gulp = _gulp;
        this.buildMode = _buildMode;
        this.init(_config);
    }

    /**
     *
     *
     * @private
     * @param {Config} _config
     * @memberof Styles
     */
    private init(_config: Config): void {
        this.DestPath = _config.Types.Styles.Destination;
        this.target =
            this.buildMode === BuildModes.dev
                ? _config.Targets.Dev
                : this.buildMode === BuildModes.release
                ? _config.Targets.Build
                : _config.Targets.Ci;
        this.SCSS = _config.Types.Styles.Sources.find(findSource(scss)) ?? null;
        this.CSS = _config.Types.Styles.Sources.find(findSource(css)) ?? null;

        this.createStyleGlobs(_config);
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @memberof Styles
     */
    private createStyleGlobs(_config: Config): void {
        const filterCallback = (folder: Folder): boolean =>
            this.filterCallback(folder);
        const folders = _config.Folders.filter(filterCallback);
        const createMappedFolder = (folder: Folder): MappedFolder<Source> =>
            this.createMappedFolder(folder);
        this.mappedFolder = folders.map(createMappedFolder);
    }

    private filterCallback(folder: Folder): boolean {
        return folder.Types.includes(scss) || folder.Types.includes(css);
    }

    private createMappedFolder(folder: Folder): MappedFolder<Source> {
        let retValue: MappedFolder<Source>;
        const tempKeyedGlobArray: Promise<KeyedGlob<Source>>[] = [];
        if (this.SCSS) {
            tempKeyedGlobArray.push(
                createKeyedGlob(this.SCSS, creatGlob(this.SCSS, folder))
            );
        }
        if (this.CSS) {
            tempKeyedGlobArray.push(
                createKeyedGlob(this.CSS, creatGlob(this.CSS, folder))
            );
        }
        Promise.all(tempKeyedGlobArray).then(
            (value) => (retValue = { Key: folder, Value: value })
        );

        return retValue;
    }
    /**
     *
     *
     * @static
     * @param {Config} config
     * @returns {boolean}
     * @memberof Styles
     */
    public static isNeeded(config: Config): boolean {
        return config?.Types?.Styles?.Sources?.length > 0 ?? false;
    }

    /**
     *
     *
     * @param {boolean} [watch=false]
     * @returns {TaskFunction}
     * @memberof Styles
     */
    public BuildScssAll(watch = false): TaskFunction {
        return this._gulp.parallel(
            this.mappedFolder.map((folder) => this.BuildCss(folder, watch))
        );
    }

    private BuildCss(
        folder: MappedFolder<Source>,
        watch = false
    ): TaskFunction {
        const CssGlob = getGlobFromKeyValuePair(folder, this.CSS);

        return myTaskFunktion<void>(
            new Promise<void>((resolve, reject) => {
                pipeline(
                    [
                        this.BuildScss(folder, watch),
                        this.getCssGulpSrc(CssGlob, watch),
                        autoPrefixer(),
                        rename({ suffix: '.min' }),
                        cleanCss(),
                        this.Destination(folder.Key.Dest),
                    ],
                    (errnoException: ErrnoException) => {
                        reject(new Error(errnoException.message));
                    }
                );
                resolve();
            })
        );
    }

    private Destination(
        folderDest: string
    ): NodeJS.ReadableStream | NodeJS.ReadWriteStream | NodeJS.WritableStream {
        const destination = getDestination(
            this.target.Path,
            folderDest,
            this.DestPath
        );
        return this._gulp.dest(
            destination,
            this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
        );
    }

    private BuildScss(
        folder: MappedFolder<Source>,
        watch = false
    ): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
        const ScssGlob = getGlobFromKeyValuePair(folder, this.SCSS);

        return this.SCSS
            ? pipeline([
                  this.getScssGulpSrc(ScssGlob, watch),
                  watch ? dependents() : through2(),
                  sass.sync({ style: 'compressed' }),
              ])
            : through2();
    }

    /**
     *
     *
     * @private
     * @param {string[]} ScssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getScssGulpSrc(
        ScssGlob: string[],
        watch: boolean
    ): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
        return this.SCSS
            ? this._gulp.src(ScssGlob, this.getOptions(watch))
            : through2.obj();
    }

    /**
     *
     *
     * @private
     * @param {string[]} CssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getCssGulpSrc(
        CssGlob: string[],
        watch: boolean
    ): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
        return this.CSS
            ? this._gulp.src(CssGlob, this.getOptions(watch))
            : through2.obj();
    }

    private getOptions(watch: boolean) {
        return watch
            ? {
                  sourcemaps: this.buildMode === BuildModes.dev,
                  since: this._gulp.lastRun(this.BuildScssAll(true)),
              }
            : {
                  sourcemaps: this.buildMode === BuildModes.dev,
              };
    }

    /**
     *
     *
     * @returns
     * @memberof Styles
     */
    public watch(): FSWatcher {
        const toWatch: string[] = [];
        this.mappedFolder.forEach((folder) => {
            toWatch.push(...getGlobFromKeyValuePair(folder, this.SCSS));
            toWatch.push(...getGlobFromKeyValuePair(folder, this.CSS));
        });
        return this._gulp.watch(
            toWatch,
            this._gulp.parallel(this.BuildScssAll(true))
        );
    }
}
