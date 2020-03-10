import { Gulp, TaskFunction } from 'gulp';
import babel from 'gulp-babel';
//@ts-ignore 7016
import * as gCoffee from 'gulp-coffee';
import rename from 'gulp-rename';
import * as gts from 'gulp-typescript';
import uglify from 'gulp-uglify';
import { pipeline } from 'stream';
import { Config, Folder, Helper, myTaskFunktion, Source, Types, Settings } from '../lib';

import through2 = require('through2');



import path = require('path');

export module Tasks {

  import ErrnoException = NodeJS.ErrnoException;
  import myCallBack = Helper.myCallBack;
  import BuildModes = Helper.BuildModes;
  import creatGlob = Helper.creatGlob;

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
    private settings: Settings;
    private buildMode: BuildModes;
    private JS: Source | null;
    private Coffee: Source | null;
    private TS: Source | null;
    private JsGlob: { folder: Folder, glob: string[] }[];
    private CoffeeGlob: { folder: Folder, glob: string[] }[];
    private TsGlob: { folder: Folder, glob: string[] }[];

    private folders: Folder[];

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
    private init(_config: Config) {

      this.folders = [];
      this.settings = _config.Types.Scripts;
      this.JS = _config?.Types?.Scripts?.Sources.find(type => type.Name.toLowerCase() === js) ?? null;
      this.Coffee = _config?.Types?.Scripts?.Sources.find(type => type.Name.toLowerCase() === coffee) ?? null;
      this.TS = _config?.Types?.Scripts?.Sources.find(type => type.Name.toLowerCase() === ts) ?? null;

      for (const folder of _config.Folders) {
        if ((folder.Types.indexOf(ts) !== -1)
          || (folder.Types.indexOf(js) !== -1)
          || (folder.Types.indexOf(coffee) !== -1)) {
          this.folders.push(folder);

          if (this.JS) {
            creatGlob(this.JS, folder).then((glob) => this.JsGlob.push({ folder, glob }));
          }
          if (this.TS) {
            creatGlob(this.TS, folder).then((glob) => this.TsGlob.push({ folder, glob }));
          }
          if (this.Coffee) {
            creatGlob(this.Coffee, folder).then((glob) => this.CoffeeGlob.push({ folder, glob }));
          }
        }
      }
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
    public BuildJsAll(): TaskFunction[] {
      let tasks: TaskFunction[];
      tasks = this.folders.map(this.BuildJS);
      return tasks;

    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @returns {TaskFunction}
     * @memberof Scripts
     */
    private BuildJS(folder: Folder): TaskFunction {

      return myTaskFunktion<void>(
        new Promise<void>(
          (resolve, reject) => {
            pipeline(
              [
                this.buildTS(this.TS, folder),
                this.buildCoffee(this.Coffee, folder),
                this.getJsGulpSrc(folder),
                babel({
                  presets: ['@babel/env'],
                  compact: true
                }),
                rename({ suffix: '.min' }),
                uglify(),
                this._gulp.dest(path.posix.join(folder.Dest + this.settings.Destination ?? 'js'), this.buildMode === BuildModes.dev ? { sourcemaps: true } : null)
              ],
              (errnoException: ErrnoException) => reject(new Error(errnoException.message))
            );
            resolve();
          }));

    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Scripts
     */
    private getJsGulpSrc(folder: Folder): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
      if (this.JS) {
        return this._gulp.src(this.JsGlob.find(
          (value: { folder: Folder; }) :boolean => value.folder === folder).glob,
          this.buildMode === BuildModes.dev ? { sourcemaps: true } : null);
      }
      return through2.obj();

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
    private buildTS(TS: Source, folder: Folder): NodeJS.WritableStream {

      if (TS) {

        let tsProject: gts.Project | null;
        tsProject = gts.createProject(//TODO:  Maybe load tsconfig from cwd to have sourcemaps.
          folder.Src + TS.Src.toString() ?? 'tsconfig.json'
        );

        return pipeline(
          [tsProject.src(), tsProject().js],
          (errnoException: ErrnoException) => myCallBack(errnoException)
        );
      }
      return through2.obj();
    }

    /**
     *
     *
     * @private
     * @param {Source} Coffee
     * @param {Folder} folder
     * @returns {NodeJS.WritableStream}
     * @memberof Scripts
     */
    private buildCoffee(Coffee: Source, folder: Folder): NodeJS.WritableStream {
      if (Coffee) {
        return pipeline(
          [
            this._gulp.src(
              this.CoffeeGlob.find((value: { folder: Folder; }) => value.folder === folder).glob,
              this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
            ),
            gCoffee()//TODO: Find a way to load the compiler options for Coffee
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
    public watch() {

      const toWatch: string[] = [];

      for (const glob of this.JsGlob) {

        toWatch.push(...glob.glob);

      }
      for (const glob of this.TsGlob) {

        toWatch.push(...glob.glob);

      }
      for (const glob of this.CoffeeGlob) {

        toWatch.push(...glob.glob);

      }

      return this._gulp.watch(toWatch, this.BuildJsAll);
    }
  }
}
