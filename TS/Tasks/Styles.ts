import { Gulp, TaskFunction } from 'gulp';
import autoPrefixer from 'gulp-autoprefixer';
//@ts-ignore 7016
import cleanCss from 'gulp-clean-css';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import dependents from 'gulp-dependents';
import { pipeline } from 'stream';
import { Config, Folder,Source, Settings ,creatGlob, Helper } from '../lib';


import through2 = require('through2');
import path = require('path');

export module Tasks {

  import ErrnoException = NodeJS.ErrnoException;

  import BuildModes = Helper.BuildModes;

  declare const scss = 'scss';
  declare const css = 'css';
  export class Styles {
    private _gulp: Gulp;
    private buildMode: BuildModes;
    private styles: Settings ;
    private folders: Folder[];
    private SCSS: Source;
    private CSS: Source;
    private ScssGlob: { folder: Folder, glob: string[] }[];
    private CssGlob: { folder: Folder, glob: string[] }[];
    private DestPath: string;


    constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes) {

      this._gulp = _gulp;
      this.buildMode = _buildMode;
      this.styles = _config.Types.Styles;
      this.folders = _config.Folders;
      this.SCSS = this.styles.Sources.find(value => value.Name.toLowerCase() === 'scss');
      this.CSS = this.styles.Sources.find(value => value.Name.toLowerCase() === 'css');

      _config.Folders.map((folder: Folder) => {
        if (folder.Types.indexOf(scss) !== -1 || folder.Types.indexOf(css) !== -1) {
          if (this.SCSS !== undefined) {
            creatGlob(this.SCSS, folder).then((glob) => this.ScssGlob.push({ folder, glob }));
          }
          if (this.CSS !== undefined) {
            creatGlob(this.CSS, folder).then((glob) => this.CssGlob.push({ folder, glob }));
          }
        }
      });
    }
    /**
     *
     * @param {Types} types The types of the config.json file.
     * @returns {boolean} If the JsTasks are needed.
     */
    public static isNeeded(config: Config): boolean {
      return config?.Types?.Styles?.Sources?.length > 0 ?? false;
    }
    /**
     * @returns {TaskFunction[]} an array of TaskFunctions to be used with Gulp parallel
     */
    public BuildScssAll(watch:boolean=false): TaskFunction[] {
            return this.folders.map((folder: Folder) => {
        if (folder.Types.indexOf(scss) !== -1 || folder.Types.indexOf(css) !== -1) {
          if(watch){
            return this.BuildScssIncremental(folder);
          }
          return this.BuildScss(folder);
        }
      });
    }

    private BuildScss(folder: Folder): TaskFunction {
      const ScssGlob = this.ScssGlob.find((value) => value.folder === folder);
      const CssGlob = this.CssGlob.find((value) => value.folder === folder);
      return (done) => new Promise<never>(() => {
        pipeline(
          [
            (this.SCSS !== undefined) ?
              this._gulp.src(
                ScssGlob.glob,
                this.buildMode === BuildModes.dev ? { sourcemaps: true } : null

              ) :
              through2.obj()
            ,
            sass.sync({ style: 'compressed' }),
            this.CSS !== undefined
              ? this._gulp.src(
                CssGlob.glob,
                this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
              )
              : through2.obj(),
            autoPrefixer(),
            rename({ suffix: '.min' }),
            cleanCss(),
            this._gulp.dest(this.DestPath, this.buildMode === BuildModes.dev ? { sourcemaps: true } : null)
          ],
          (errnoException: ErrnoException) => {
            done(new Error(errnoException.message));
          }
        );
        done();
      });
    }

    private BuildScssIncremental(folder: Folder):TaskFunction {
      const ScssGlob = this.ScssGlob.find((value) => value.folder === folder);
      const CssGlob = this.CssGlob.find((value) => value.folder === folder);
      return (done) => new Promise<never>(() => {
        pipeline(
          [
            (this.SCSS !== undefined) ?
              this._gulp.src(
                ScssGlob.glob,
                this.buildMode === BuildModes.dev ? { sourcemaps: true, since: this._gulp.lastRun(this.BuildScssIncremental(folder)) } : null

              ) :
              through2.obj(),
              (this.SCSS !== undefined) ?
              dependents():
              through2.obj()
            ,
            sass.sync({ style: 'compressed' }),
            this.CSS !== undefined
              ? this._gulp.src(
                CssGlob.glob,
                this.buildMode === BuildModes.dev ? { sourcemaps: true, since: this._gulp.lastRun(this.BuildScssIncremental(folder)) } : null
              )
              : through2.obj(),
            autoPrefixer(),
            rename({ suffix: '.min' }),
            cleanCss(),
            this._gulp.dest(this.DestPath, this.buildMode === BuildModes.dev ? { sourcemaps: true } : null)
          ],
          (errnoException: ErrnoException) => {
            done(new Error(errnoException.message));
          }
        );
        done();
      });
    }
    /**
     * Activates the Watch for changes of the scripts.
     */
    public watch() {
      const toWatch: string[] = [];
      for (const index in this.ScssGlob) {
        if (this.ScssGlob.hasOwnProperty(index)) {
          toWatch.push(...this.ScssGlob[index].glob);
        }
      }
      for (const index in this.CssGlob) {
        if (this.CssGlob.hasOwnProperty(index)) {
          toWatch.push(...this.CssGlob[index].glob);

        }
      }
      return this._gulp.watch(toWatch,  this._gulp.parallel(this.BuildScssAll(true)));
    }
  }
}
