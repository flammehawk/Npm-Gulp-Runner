

///<reference path="../gulpfile.ts"/>
import { pipeline } from 'stream';
import { TaskFunction } from 'gulp';
import * as sass from 'gulp-sass';
import {Options} from 'gulp-autoprefixer';
import * as cleanCss from 'gulp-clean-css';
import rename = require('gulp-rename');
import { Config } from '../config/Config';
import { Gulp } from 'gulp';
import * as autoPrefixer from 'gulp-autoprefixer';
import {Helper} from './../lib';

export module Tasks {

    import Folder = Config.Folder;
    import config = Config.Config;
    import Type = Config.Type;
    import ErrnoException = NodeJS.ErrnoException;
    declare const scss= 'scss';
    class ScssTasks {

        private _gulp;
        private config: config;

        constructor(_gulp:Gulp, config: config ) {
            this.config = config;
            this._gulp = _gulp;
        }
        public static isNeeded(config:config) {
            const result =  config.Types.find(
                (value)=> {
                    return (value.Name.toLowerCase()==='scss')? true : false;
                }
            );
            return  (result !==undefined );
        }

        public BuildScssAll(done: TaskFunction) {
            let tasks;
            tasks = this.config.Folders.every((folder: Folder) => { return this.BuildScss(folder, done);});
            this._gulp.parallel(...tasks);
            done(null);
        }

        private BuildScss(folder: Folder, done: TaskFunction) {
            const type = this.config.Types.find(type => type.Name.toLowerCase() === 'scss');

            return pipeline([
                this._gulp.src(folder.Src.concat(type.Src.toString())),
                sass({style: 'compressed'}),
                autoPrefixer(),
                rename({suffix: '.min'}),
                cleanCss(),
                this._gulp.dest(folder.Dest + type.Dest)
            ], (errnoException: ErrnoException) => {
                Helper.myCallBack(errnoException, done);
            });
        }
    }
}