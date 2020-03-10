import { Helper, Config, Convert } from './TS/lib';
import { Tasks } from './TS/Tasks';
import { TaskFunction } from 'gulp';



import path = require('path');
import Gulp = require('Gulp');

/**
 * Core module of the Npm Gulp Runner
 */
export module NpmGulpRunner {

  import Json = Helper.Json;
  import BuildModes = Helper.BuildModes;
  import Clean = Tasks.Clean;
  import Styles = Tasks.Styles;
  import Scripts = Tasks.Scripts;
  import Copy = Tasks.Copy;

  type GulpType = typeof Gulp;

  /**
   * Main Class of the Npm Gulp Runner
   */
  export class GulpRunner {
    private config: Config;
    private _gulp: GulpType;
    private buildModes: BuildModes;
    private styles: Styles;
    private scripts: Scripts;
    private copy: Copy;
    private clean: Clean;

    /**
     * @constructor
     * @param {GulpType} _gulp an instance of Gulp that shall be used by the Runner.
     * @param {Json} _configJson the Configuration that shall be used.
     * @param {BuildModes} buildModes an Enum that represents the current BuildMode.
     */
    constructor(_gulp: GulpType, _configJson: Json, buildModes: BuildModes) {
      this._gulp = _gulp;
      this.config = Convert.toConfig(_configJson.toString());
      if (Styles.isNeeded(this.config)) {
        this.styles = new Styles(this._gulp, this.config, this.buildModes);
      }
      if (Scripts.isNeeded(this.config.Types)) {
        this.scripts = new Scripts(this._gulp, this.config, this.buildModes);
      }
      this.copy = new Copy(this._gulp, this.config, this.buildModes);
      this.clean = new Clean(this.config, this.buildModes);
    }

    private Clean(): TaskFunction {

      return this._gulp.parallel(this.clean.clean());
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
      if (this.styles) {
        parallelTasks.push(...this.styles.BuildScssAll());
      }
      if (this.scripts) {
        parallelTasks.push(...this.scripts.BuildJsAll());
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
        if (this.styles) {
          this.styles.watch();
        }
        if (this.scripts) {
          this.scripts.watch();
        }
        this.copy.watch();
        done();
      };
    }
  }
}
