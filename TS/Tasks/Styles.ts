import { Gulp, TaskFunction } from 'gulp';
//@ts-ignore 7016
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
    BuildModes,
    myTaskFunktion,
    getGlobFromKeyValuePair,
    MappedFolder,
    findSource,
    folderTypeFilter,
    mapFolder,
    GulpStream,
} from '../lib';

import through2 = require('through2');

import ErrnoException = NodeJS.ErrnoException;
import { FSWatcher } from 'fs';
import { BaseTask } from './BaseTask';

declare const scss = 'scss';
declare const css = 'css';

/**
 *
 *
 * @export
 * @class Styles
 */
export class Styles extends BaseTask<Source> {
    /**
     *Creates an instance of Styles.
     * @param {Gulp} _gulp
     * @param {Config} _config
     * @param {BuildModes} _buildMode
     * @memberof Styles
     */
    constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes) {
        super(_gulp, _buildMode);
        this.init(_config);
    }

    /**
     *
     *
     * @private
     * @param {Config} _config
     * @memberof Styles
     */
    protected init(_config: Config): void {
        this.destPath = _config.Types.Styles.Destination;
        super.init(_config);
        super.initSources([scss, css], _config.Types.Styles.Sources);

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
        const boundMapFolder = (folder: Folder): MappedFolder<Source> =>
            mapFolder(folder, this.sources);
        this.mappedFolder = _config.Folders.filter(
            folderTypeFilter([scss, css])
        ).map(boundMapFolder);
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
    public BuildScssAll(watch = false): TaskFunction[] {
        return this.mappedFolder.map((folder) => this.BuildCss(folder, watch));
    }

    private BuildCss(
        folder: MappedFolder<Source>,
        watch = false
    ): TaskFunction {
        const CssGlob = getGlobFromKeyValuePair(
            folder,
            this.sources.find(findSource(css))
        );

        return myTaskFunktion<void>(
            new Promise<void>((resolve, reject) => {
                pipeline(
                    [
                        this.BuildScss(folder, watch),
                        this.getCssGulpSrc(CssGlob, watch),
                        autoPrefixer(),
                        rename(this.renameOptions),
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

    private BuildScss(folder: MappedFolder<Source>, watch = false): GulpStream {
        const ScssGlob = getGlobFromKeyValuePair(
            folder,
            this.sources.find(findSource(scss))
        );

        return this.sources.find(findSource(scss))
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
    private getScssGulpSrc(ScssGlob: string[], watch: boolean): GulpStream {
        const BuildScssAll = (watch: boolean): TaskFunction[] =>
            this.BuildScssAll(watch);
        return this._gulp.src(ScssGlob, this.getOptions(watch, BuildScssAll));
    }

    /**
     *
     *
     * @private
     * @param {string[]} CssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getCssGulpSrc(CssGlob: string[], watch: boolean): GulpStream {
        const BuildScssAll = (watch: boolean): TaskFunction[] =>
            this.BuildScssAll(watch);
        return this.sources.find(findSource(css))
            ? this._gulp.src(CssGlob, this.getOptions(watch, BuildScssAll))
            : through2.obj();
    }

    /**
     *
     *
     * @returns
     * @memberof Styles
     */
    public watch(): FSWatcher {
        const toWatch: string[] = this.getToWatchGlobs();
        return this._gulp.watch(
            toWatch,
            this._gulp.parallel(this.BuildScssAll(true))
        );
    }
}
