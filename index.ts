import { Helper, Config } from './TS/lib';
import { JS, CSS, Clean, Copy } from './TS/Tasks';
import { TaskFunction } from 'gulp';



import path = require('path');
import Gulp = require('Gulp');

export module blob {

  import Json = Helper.Json;
  import BuildModes = Helper.BuildModes;

  type GulpType = typeof Gulp;

  export class GulpRunner {
    private config: Config.Config;
    private _gulp: GulpType;
    private buildModes: BuildModes;
    private Scss: CSS.Tasks;
    private Js: JS.Tasks;

    constructor(_gulp: GulpType, _configJson: Json, buildModes: BuildModes) {
      this._gulp = _gulp;
      this.config = Config.Convert.toConfig(_configJson.toString());
      if (CSS.Tasks.isNeeded) {
        this.Scss = new CSS.Tasks(this._gulp, this.config, this.buildModes);
      }
      if (JS.Tasks.isNeeded) {
        this.Js = new JS.Tasks(this._gulp, this.config, this.buildModes);
      }

    }

    private Clean(): TaskFunction {
      const clean = new Clean.Task(this.config, this.buildModes);
      return this._gulp.parallel(clean.clean());
    }
    private Copy(): TaskFunction {
      const copy = new Copy.Task(this._gulp, this.config, this.buildModes);
      return this._gulp.parallel(copy.copy());

    }
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
    public watch(): TaskFunction {
      return (done) => {
        if (CSS.Tasks.isNeeded) {
          this.Scss.watch();
        }
        if (JS.Tasks.isNeeded) {
          this.Js.watch();
        }
      };
    }
  }
}
