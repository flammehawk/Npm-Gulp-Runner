import { Helper, Config } from './TS/lib';
import { JS, CSS, Clean, Copy } from './TS/Tasks';
import { TaskFunction } from 'gulp';



import path = require('path');
import Gulp = require('Gulp');

/**
 * Core module of the Npm Gulp Runner
 */
export module NpmGulpRunner {

  import Json = Helper.Json;
  import BuildModes = Helper.BuildModes;

  type GulpType = typeof Gulp;

  /**
   * Main Class of the Npm Gulp Runner
   */
  export class GulpRunner {
    private config: Config.Config;
    private _gulp: GulpType;
    private buildModes: BuildModes;
    private Scss: CSS.Tasks;
    private Js: JS.Tasks;
    private copy: Copy.Task;

    /**
     * @constructor
     * @param {GulpType} _gulp an instance of Gulp that shall be used by the Runner.
     * @param {Json} _configJson the Configuration that shall be used.
     * @param {BuildModes} buildModes an Enum that represents the current BuildMode.
     */
    constructor(_gulp: GulpType, _configJson: Json, buildModes: BuildModes) {
      this._gulp = _gulp;
      this.config = Config.Convert.toConfig(_configJson.toString());
      if (CSS.Tasks.isNeeded) {
        this.Scss = new CSS.Tasks(this._gulp, this.config, this.buildModes);
      }
      if (JS.Tasks.isNeeded) {
        this.Js = new JS.Tasks(this._gulp, this.config, this.buildModes);
      }
      this.copy = new Copy.Task(this._gulp, this.config, this.buildModes);

    }

    private Clean(): TaskFunction {
      const clean = new Clean.Task(this.config, this.buildModes);
      return this._gulp.parallel(clean.clean());
    }
    private Copy(): TaskFunction {
      return this._gulp.parallel(this.copy.copy());
    }
    /**
     * The Build Functionality that is exposed call to build
     * executes Clean, build of scripts and styles as well as copy of static files
     * returns a Valid Gulp Taskfunction
     */
    public Build(): TaskFunction {
      const parallelTasks = [];
      if (CSS.Tasks.isNeeded) {
        parallelTasks.push(...this.Scss.BuildScssAll());
      }
      if (JS.Tasks.isNeeded) {
        parallelTasks.push(...this.Js.BuildJsAll());
      }
      return this._gulp.series(this.Clean(), this._gulp.parallel(...parallelTasks, this.Copy()));
    }
   /**
     * The Watch Functionality that is exposed call to build
     * executes incrementalbuild of scripts and styles as well as copy of static files
     * returns a Valid Gulp Taskfunction
     */
    public watch(): TaskFunction {
      return (done) => {
        if (CSS.Tasks.isNeeded) {
          this.Scss.watch();
        }
        if (JS.Tasks.isNeeded) {
          this.Js.watch();
        }
        this.copy.watch();
        done();
      };
    }
  }
}
