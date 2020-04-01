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
    creatGlob,
    myTaskFunktion,
    Source,
    Types,
    createKeyedGlob,
    KeyedGlob,
    MappedFolder,
    getGlobFromKeyValuePair,
    getDestination,
    findSource,
    Build,
} from '../lib';

import through2 = require('through2');

import ErrnoException = NodeJS.ErrnoException;

import { FSWatcher } from 'fs';

declare const js = 'js';
declare const coffee = 'coffee';
declare const ts = 'ts';

/**
 *
 *
 * @export
 * @class Scripts
 */
export class Scripts {
    private _gulp: Gulp;

    private buildMode: BuildModes;
    private JS: Source | null;
    private Coffee: Source | null;
    private TS: Source | null;

    private mappedFolder: MappedFolder<Source>[];
    private target: Build;
    private destPath: string;

    /**
     *Creates an instance of Scripts.
     * @param {Gulp} _gulp
     * @param {Config} _config
     * @param {BuildModes} _buildMode
     * @memberof Scripts
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
     * @memberof Scripts
     */
    private init(_config: Config): void {
        this.destPath = _config.Types.Scripts.Destination;
        this.target =
            this.buildMode === BuildModes.dev
                ? _config.Targets.Dev
                : this.buildMode === BuildModes.release
                ? _config.Targets.Build
                : _config.Targets.Ci;
        this.JS = _config?.Types?.Scripts?.Sources.find(findSource(js)) ?? null;
        this.Coffee =
            _config?.Types?.Scripts?.Sources.find(findSource(coffee)) ?? null;
        this.TS = _config?.Types?.Scripts?.Sources.find(findSource(ts)) ?? null;

        const folderFilter = (folder: Folder): boolean =>
            this.folderFilter(folder);
        const mapFolder = (folder: Folder): MappedFolder<Source> =>
            this.mapFolder(folder);
        this.mappedFolder = _config.Folders.filter(folderFilter).map(mapFolder);
    }

    private folderFilter(folder: Folder): boolean {
        return (
            folder.Types.includes(ts) ||
            folder.Types.includes(js) ||
            folder.Types.includes(coffee)
        );
    }

    private mapFolder(folder: Folder): MappedFolder<Source> {
        const tempKeyedGlobArray: Promise<KeyedGlob<Source>>[] = [];

        if (this.JS) {
            tempKeyedGlobArray.push(
                createKeyedGlob(this.JS, creatGlob(this.JS, folder))
            );
        }

        if (this.TS) {
            tempKeyedGlobArray.push(
                createKeyedGlob(this.TS, creatGlob(this.TS, folder))
            );
        }

        if (this.Coffee) {
            tempKeyedGlobArray.push(
                createKeyedGlob(this.Coffee, creatGlob(this.Coffee, folder))
            );
        }

        return this.resolveTempKeyedGlobArray(tempKeyedGlobArray, folder);
    }

    private resolveTempKeyedGlobArray(
        tempKeyedGlobArray: Promise<KeyedGlob<Source>>[],
        folder: Folder
    ): MappedFolder<Source> {
        let retValue: MappedFolder<Source>;
        Promise.all(tempKeyedGlobArray).then(
            (value) => (retValue = { Key: folder, Value: value })
        );
        return retValue;
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
                const babelOptions = {
                    presets: ['@babel/env'],
                    compact: true,
                };
                const renameOptions = { suffix: '.min' };
                pipeline(
                    [
                        //this.buildTS(this.TS, folder, watch),
                        this.buildCoffee(this.Coffee, folder),
                        this.getJsGulpSrc(folder, watch),
                        babel(babelOptions),
                        rename(renameOptions),
                        uglify(),
                        this.Destination(folder.Key.Dest),
                    ],
                    (errnoException: ErrnoException) =>
                        reject(new Error(errnoException.message))
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
            this.destPath
        );
        return this._gulp.dest(
            destination,
            this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
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
    ): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
        if (this.JS) {
            const glob = getGlobFromKeyValuePair(folder, this.JS);
            return this._gulp.src(glob, this.getOptions(watch));
        }
        return through2.obj();
    }

    private getOptions(
        watch: boolean
    ): { sourcemaps: boolean; since?: number } {
        return watch
            ? {
                  sourcemaps: this.buildMode === BuildModes.dev,
                  since: this._gulp.lastRun(
                      this._gulp.parallel(this.BuildJsAll(true))
                  ),
              }
            : { sourcemaps: this.buildMode === BuildModes.dev };
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
    ): NodeJS.WritableStream {
        if (Coffee) {
            const glob = getGlobFromKeyValuePair(folder, this.JS);
            return pipeline(
                [
                    this._gulp.src(glob, {
                        sourcemaps: this.buildMode === BuildModes.dev,
                    }),
                    gCoffee(), //TODO: Find a way to load the compiler options for Coffee
                ],
                (errnoException: ErrnoException) => myCallBack(errnoException)
            );
        }

        return through2.obj();
    }

    /**
     *
     *
     * @returns
     * @memberof Scripts
     */
    public watch(): FSWatcher {
        const toWatch: string[] = [];
        this.mappedFolder.forEach((folder) => {
            toWatch.push(...getGlobFromKeyValuePair(folder, this.JS));
            toWatch.push(...getGlobFromKeyValuePair(folder, this.TS));
            toWatch.push(...getGlobFromKeyValuePair(folder, this.Coffee));
        });

        const BuildJsAll = (): TaskFunction[] => this.BuildJsAll(true);

        return this._gulp.watch(toWatch, BuildJsAll);
    }
}
