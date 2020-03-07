import { Config } from "./lib/config";
import { Helper } from "./lib";
import { JS, CSS } from "./Tasks";
import { cwd } from "process";

import Gulp = require("Gulp");

export module blob {
  import TaskFunction = Gulp.TaskFunction;
  import myCallBack = Helper.myCallBack;
  import Json = Helper.Json;
  import BuildModes = Helper.BuildModes;

  type GulpType = typeof Gulp;

  export class GulpRunner {
    private config: Config.Config;
    private _gulp: GulpType;
    private buildModes: BuildModes;
    private GulpRunnerCalLerCwd: string;

    constructor(_gulp: GulpType, _configJson: Json, buildModes: BuildModes) {
      this._gulp = _gulp;
      this.config = Config.Convert.toConfig(_configJson.toString());
      this.GulpRunnerCalLerCwd = cwd();
    }

    Build() {
      const parallelTasks = [];

      if (CSS.Tasks.isNeeded) {
        const Scss = new CSS.Tasks(this._gulp, this.config, this.buildModes);
        parallelTasks.push(() => Scss.BuildScssAll());
      }
      if (JS.Tasks.isNeeded) {
        const Js = new JS.Tasks(this._gulp, this.config, this.buildModes);
        parallelTasks.push(() => Js.BuildJsAll());
      }
      return this._gulp.parallel(...parallelTasks);
    }
  }
}
