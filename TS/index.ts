import { Config, Convert, Json, BuildModes } from './lib';
import { Tasks } from './Tasks';
import { TaskFunction } from 'gulp';

import Gulp = require('Gulp');

/**
 * Core module of the Npm Gulp Runner
 */

import Clean = Tasks.Clean;
import Styles = Tasks.Styles;
import Scripts = Tasks.Scripts;
import Copy = Tasks.Copy;

type GulpType = typeof Gulp;

/**
 *
 *
 * @export
 * @class GulpRunner
 */
export class GulpRunner {
    private config: Config;
    private _gulp: GulpType;
    private styles: Styles;
    private scripts: Scripts;
    private copy: Copy;
    private clean: Clean;

    /**
     *Creates an instance of GulpRunner.
     * @param {GulpType} _gulp
     * @param {Json} _configJson
     * @param {BuildModes} buildModes
     * @memberof GulpRunner
     */
    constructor(_gulp: GulpType, _configJson: Json, buildModes: BuildModes) {
        this._gulp = _gulp;
        this.config = Convert.toConfig(_configJson.toString());

        if (Styles.isNeeded(this.config)) {
            this.styles = new Styles(this._gulp, this.config, buildModes);
        }
        if (Scripts.isNeeded(this.config.Types)) {
            this.scripts = new Scripts(this._gulp, this.config, buildModes);
        }
        this.copy = new Copy(this._gulp, this.config, buildModes);
        this.clean = new Clean(this.config, buildModes);
    }

    /**
     *
     *
     * @private
     * @returns {TaskFunction}
     * @memberof GulpRunner
     */
    private Clean(): TaskFunction {
        return this._gulp.parallel(this.clean.clean());
    }

    /**
     *
     *
     * @private
     * @returns {TaskFunction}
     * @memberof GulpRunner
     */
    private Copy(): TaskFunction {
        return this._gulp.parallel(this.copy.copy());
    }

    /**
     *
     *
     * @returns {TaskFunction}
     * @memberof GulpRunner
     */
    public Build(): TaskFunction {
        const parallelTasks = [];
        if (this.styles) {
            parallelTasks.push(...this.styles.BuildScssAll());
        }
        if (this.scripts) {
            parallelTasks.push(...this.scripts.BuildJsAll());
        }
        return this._gulp.series(
            this.Clean(),
            this._gulp.parallel(...parallelTasks, this.Copy())
        );
    }

    public watch(): void {
        this.copy.watch();
        this.styles?.watch();
        this.scripts?.watch();
    }
}
