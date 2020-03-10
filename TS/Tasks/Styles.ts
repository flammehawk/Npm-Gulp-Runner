import { Gulp, TaskFunction } from 'gulp';
import autoPrefixer from 'gulp-autoprefixer';
//@ts-ignore 7016
import cleanCss from 'gulp-clean-css';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import dependents from 'gulp-dependents';
import { pipeline } from 'stream';
import { Config, Folder, Source, Settings, creatGlob, Helper, myTaskFunktion, Types } from '../lib';


import through2 = require('through2');
import path = require('path');

export module Tasks {

  import ErrnoException = NodeJS.ErrnoException;

  import BuildModes = Helper.BuildModes;

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
    private styles: Settings;
    private folders: Folder[];
    private SCSS: Source | null;
    private CSS: Source | null;
    private ScssGlobs: { folder: Folder, glob: string[] }[];
    private CssGlobs: { folder: Folder, glob: string[] }[];
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
      this.styles = _config.Types.Styles;

      this.SCSS = this.styles.Sources.find(value => value.Name.toLowerCase() === scss) ?? null;
      this.CSS = this.styles.Sources.find(value => value.Name.toLowerCase() === css) ?? null;

      this.init(_config);
    }

    /**
     *
     *
     * @private
     * @param {Config} _config
     * @memberof Styles
     */
    private init(_config: Config) {

      this.folders = [];

      this.SCSS = this.styles.Sources.find(value => value.Name.toLowerCase() === scss) ?? null;
      this.CSS = this.styles.Sources.find(value => value.Name.toLowerCase() === css) ?? null;


      for (const folder of _config.Folders) {
        if(this.filterFolders(folder)) {

          this.folders.push(folder);
          this.createStyleGlobs(folder);
        }

      }
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @returns {boolean}
     * @memberof Styles
     */
    private filterFolders(folder: Folder): boolean {
      return ((folder.Types.indexOf(scss) !== -1) || (folder.Types.indexOf(css) !== -1));
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @memberof Styles
     */
    private createStyleGlobs(folder: Folder): void {
      if (this.SCSS) {
        creatGlob(this.SCSS, folder).then((glob) => this.ScssGlobs.push({ folder, glob }));
      }
      if (this.CSS) {
        creatGlob(this.CSS, folder).then((glob) => this.CssGlobs.push({ folder, glob }));
      }
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
    public BuildScssAll(watch: boolean = false): TaskFunction {

      return this._gulp.parallel(
        this.folders.map((folder)=>this.BuildScss(folder,true),this));
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @param {boolean} [watch=false]
     * @returns {TaskFunction}
     * @memberof Styles
     */
    private BuildScss(folder: Folder, watch: boolean = false): TaskFunction {

      const ScssGlob = this.ScssGlobs.find((value) => value.folder === folder).glob;
      const CssGlob = this.CssGlobs.find((value) => value.folder === folder).glob;

      return myTaskFunktion<void>(
        new Promise<void>((resolve, reject) => {
          pipeline(
            [
              watch ? this.getScssGulpSrcIncremental(ScssGlob) : this.getScssGulpSrc(ScssGlob),
              sass.sync({ style: 'compressed' }),
              watch ? this.getCssGulpSrcIncremental(CssGlob) : this.getCssGulpSrc(CssGlob),
              autoPrefixer(),
              rename({ suffix: '.min' }),
              cleanCss(),
              this._gulp.dest(this.DestPath, this.buildMode === BuildModes.dev ? { sourcemaps: true } : null)
            ],
            (errnoException: ErrnoException) => {
              reject(new Error(errnoException.message));
            }
          );
          resolve();
        }));
    }

    /**
     *
     *
     * @private
     * @param {string[]} ScssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getScssGulpSrc(ScssGlob: string[]): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
      return this.SCSS ?
        this._gulp.src(ScssGlob, this.buildMode === BuildModes.dev ? { sourcemaps: true } : null) :
        through2.obj();
    }

    /**
     *
     *
     * @private
     * @param {string[]} CssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getCssGulpSrc(CssGlob: string[]): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
      return this.SCSS ?
        this._gulp.src(CssGlob, this.buildMode === BuildModes.dev ? { sourcemaps: true } : null) :
        through2.obj();
    }

    /**
     *
     *
     * @private
     * @param {string[]} ScssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getScssGulpSrcIncremental(ScssGlob: string[]): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
      return this.SCSS ?
        this._gulp.src(ScssGlob, this.buildMode === BuildModes.dev ? { sourcemaps: true, since: this._gulp.lastRun(this.BuildScssAll(true)) } : null) :
        through2.obj();
    }

    /**
     *
     *
     * @private
     * @param {string[]} CssGlob
     * @returns {(NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream)}
     * @memberof Styles
     */
    private getCssGulpSrcIncremental(CssGlob: string[]): NodeJS.ReadWriteStream | NodeJS.ReadableStream | NodeJS.WritableStream {
      return this.SCSS ?
        this._gulp.src(CssGlob, this.buildMode === BuildModes.dev ? { sourcemaps: true, since: this._gulp.lastRun(this.BuildScssAll(true)) } : null) :
        through2.obj();
    }



    /**
     *
     *
     * @returns
     * @memberof Styles
     */
    public watch() {

      const toWatch: string[] = [];

      for (const ScssGlob of this.ScssGlobs) {
        toWatch.push(...ScssGlob.glob);
      }
      for (const CssGlob of this.CssGlobs) {
        toWatch.push(...CssGlob.glob);
      }
      return this._gulp.watch(toWatch, this._gulp.parallel(this.BuildScssAll(true)));
    }
  }
}
