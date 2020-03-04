import Gulp = require("gulp");

import { Convert, Config, Folder } from "./config/Config";
import { pipeline } from "stream";
import { TaskFunction } from "gulp";
import ErrnoException = NodeJS.ErrnoException;
import * as sass from"gulp-sass";
import * as autoPrefixer from "gulp-autoprefixer";
import * as cleanCss from "gulp-clean-css"
import rename = require("gulp-rename");


export class GulpRunner {

    private config: Config;
    private _gulp: Gulp;

    constructor(_gulp: Gulp, _configJson: object) {
        this._gulp = _gulp;
        this.config = Convert.toConfig(_configJson.toString());
    }

    public BuildScssAll(done: TaskFunction) {
        let tasks;
        tasks = this.config.Folders.map((folder: Folder) => this.BuildScss(folder, done));
        this._gulp.parallel(...tasks);
        done();
    }

    public BuildScss(folder: Folder, done: TaskFunction) {
        let  type = this.config.Types.find(type => type.Name.toLowerCase() === "scss");
        return pipeline([
            this._gulp.src(folder.Src + type.Src),
            sass({ style: 'compressed' }),
            autoPrefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9' ),
            rename( { suffix: '.min' } ),
            cleanCss(),
            this._gulp.dest(folder.Dest + type.Dest)
        ], (errnoException: ErrnoException) => {
            this.callback(errnoException, done);
        });
    }


    private callback(errnoException: ErrnoException, done) {
        if (errnoException) {
            console.error(errnoException);
            done(errnoException.message);
        } else {
            done();
        }
    }


}

