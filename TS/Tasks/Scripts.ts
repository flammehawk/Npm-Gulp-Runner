import { Gulp, TaskFunction } from 'gulp';
import babel from 'gulp-babel';

// @ts-ignore:rule(7016)
import gCoffee = require('gulp-coffee');

import rename from 'gulp-rename';
//import * as gts from 'gulp-typescript';
import uglify from 'gulp-uglify';
import { pipeline } from 'stream';
import {
    Config,
    Folder,
    myCallBack,
    BuildModes,
    myTaskFunktion,
    Source,
    Types,
    MappedFolder,
    mapFolder,
    getGlobFromKeyValuePair,
    findSource,
    folderTypeFilter,
    GulpStream,
} from '../lib';

import through2 = require('through2');

import ErrnoException = NodeJS.ErrnoException;

import { FSWatcher } from 'fs';
import { BaseTask } from './BaseTask';

/**
 *
 *
 * @export
 * @class Scripts
 */
export class Scripts extends BaseTask<Source> {
    protected readonly js = 'js';
    protected readonly coffee = 'coffee';
    protected readonly ts = 'ts';
    protected readonly babelOptions = {
        presets: ['@babel/env'],
        compact: true,
    };

    /**
     *Creates an instance of Scripts.
     * @param {Gulp} _gulp
     * @param {Config} _config
     * @param {BuildModes} _buildMode
     * @memberof Scripts
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
     * @memberof Scripts
     */
    protected init(_config: Config): void {
        this.destPath = _config.Types.Scripts.Destination;

        super.init(_config);
        super.initSources(
            [this.ts, this.js, this.coffee],
            _config.Types.Scripts.Sources
        );
        const boundMapFolder = (folder: Folder): MappedFolder<Source> =>
            mapFolder(folder, this.sources);
        this.mappedFolder = _config.Folders.filter(
            folderTypeFilter([this.ts, this.js, this.coffee])
        ).map(boundMapFolder);
    }

    /**
     *
     *
     * @static
     * @param {Types} types
     * @returns {boolean}
     * @memberof Scripts
     */
    public static isNeeded(types: Types): boolean {
        return types?.Scripts?.Sources?.length > 0 ?? false;
    }

    /**
     *
     *
     * @returns {TaskFunction[]}
     * @memberof Scripts
     */
    public BuildJsAll(watch = false): TaskFunction[] {
        return this.mappedFolder.map((folder) => this.BuildJS(folder, watch));
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @returns {TaskFunction}
     * @memberof Scripts
     */
    private BuildJS(
        folder: MappedFolder<Source>,
        watch: boolean
    ): TaskFunction {
        return myTaskFunktion<void>(
            new Promise<void>((resolve, reject) => {
                pipeline(
                    [
                        //this.buildTS(this.TS, folder, watch),
                        this.buildCoffee(
                            this.sources.find(findSource(this.coffee)),
                            folder
                        ),
                        this.getJsGulpSrc(folder, watch),
                        babel(this.babelOptions),
                        rename(this.renameOptions),
                        uglify(),
                        super.Destination(folder.Key.Dest),
                    ],
                    (errnoException: ErrnoException) =>
                        reject(new Error(errnoException.message))
                );
                resolve();
            })
        );
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Scripts
     */
    private getJsGulpSrc(
        folder: MappedFolder<Source>,
        watch: boolean
    ): GulpStream {
        const js = this.sources.find(findSource(this.js));
        const BuildJsAll = (watch: boolean): TaskFunction[] =>
            this.BuildJsAll(watch);
        let retVal: GulpStream = through2.obj();
        if (this.sources.includes(js)) {
            const glob = getGlobFromKeyValuePair(folder, js);
            retVal = this._gulp.src(glob, this.getOptions(watch, BuildJsAll));
        }
        return retVal;
    }

    /**
     *
     *
     * @private
     * @param {Source} TS
     * @param {Folder} folder
     * @returns {NodeJS.WritableStream}
     * @memberof Scripts
     */
    // private buildTS(TS: Source, folder: MappedFolder<Source>): NodeJS.WritableStream {
    //     if (TS) {
    //         let tsProject: gts.Project | null;
    //         tsProject = gts.createProject(
    //             //TODO:  Maybe load tsconfig from cwd to have sourcemaps.
    //             folder.Src + TS.Src.toString() ?? 'tsconfig.json'
    //         );

    //         return pipeline(
    //             [tsProject.src(), tsProject().js],
    //             (errnoException: ErrnoException) => myCallBack(errnoException)
    //         );
    //     }
    //     return through2.obj();
    // }

    /**
     *
     *
     * @private
     * @param {Source} Coffee
     * @param {Folder} folder
     * @returns {NodeJS.WritableStream}
     * @memberof Scripts
     */
    private buildCoffee(
        Coffee: Source,
        folder: MappedFolder<Source>
    ): GulpStream {
        let retVal: GulpStream = through2.obj();
        if (Coffee) {
            const glob = getGlobFromKeyValuePair(folder, Coffee);
            retVal = pipeline(
                [
                    this._gulp.src(glob, {
                        sourcemaps: this.buildMode === BuildModes.dev,
                    }),
                    gCoffee(), //TODO: Find a way to load the compiler options for Coffee
                ],
                (errnoException: ErrnoException) => myCallBack(errnoException)
            );
        }

        return retVal;
    }

    /**
     *
     *
     * @returns
     * @memberof Scripts
     */
    public watch(): FSWatcher {
        const toWatch: string[] = this.getToWatchGlobs();

        const BuildJsAll = (): TaskFunction[] => this.BuildJsAll(true);

        return this._gulp.watch(toWatch, this._gulp.parallel(BuildJsAll));
    }
}
