///<reference path="./../gulpfile.ts"/>
import { pipeline } from 'stream';
import { TaskFunction } from 'gulp';
import sass from 'gulp-sass';
//@ts-ignore 7016
import cleanCss from 'gulp-clean-css';
import rename from 'gulp-rename';
import { Config } from '../lib/config';
import { Gulp } from 'gulp';
import autoPrefixer from 'gulp-autoprefixer';
import { Helper } from '../lib';
import through2 = require('through2');

export namespace Css {
  import Folder = Config.Folder;
  import config = Config.Config;
  import Type = Config.Type;
  import ErrnoException = NodeJS.ErrnoException;
  import myCallBack = Helper.myCallBack;
  import BuildModes = Helper.BuildModes;
  declare const scss = 'scss';
  declare const css = 'css';
  export class Tasks {
    private _gulp: Gulp;
    private config: config;
    private buildMode: BuildModes;

    constructor(_gulp: Gulp, config: config, _buildMode: BuildModes) {
      this.config = config;
      this._gulp = _gulp;
      this.buildMode = _buildMode;
    }
    public static isNeeded(config: config) {
      const result = config.Types.find(value => {
        return value.Name.toLowerCase() === scss || value.Name.toLowerCase() === css ? true : false;
      });
      return result !== undefined;
    }

    public BuildScssAll(done: TaskFunction) {
      let tasks: TaskFunction[];
      tasks = this.config.Folders.map((folder: Folder) => {
        return this.BuildScss(folder, done);
      });
      this._gulp.parallel(...tasks);
      done(null);
    }

    private BuildScss(folder: Folder, done: TaskFunction) {
      const SCSS = this.config.Types.find(type => type.Name.toLowerCase() === 'scss');
      const CSS = this.config.Types.find(type => type.Name.toLowerCase() === 'css');
      pipeline(
        [
          this._gulp.src(
            folder.Src.concat(SCSS.Src.toString()),
            this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
          ),
          sass.sync({ style: 'compressed' }),
          CSS !== undefined
            ? this._gulp.src(
                folder.Src.concat(CSS.Src.toString()),
                this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
              )
            : through2.obj(),
          autoPrefixer(),
          rename({ suffix: '.min' }),
          cleanCss(),
          this._gulp.dest(folder.Dest + SCSS?.Dest??CSS?.Dest?? 'css/',this.buildMode === BuildModes.dev? {sourcemaps: true}:null)
        ],
        (errnoException: ErrnoException) => {
          myCallBack(errnoException, done);
        }
      );
      return done;
    }
  }
}
