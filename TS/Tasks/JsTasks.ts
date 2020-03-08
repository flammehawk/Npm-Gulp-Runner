import { Gulp } from 'gulp';
import { Helper } from '../lib';
import { Config } from '../lib/config';
import { pipeline } from 'stream';
import { TaskFunction } from 'gulp';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
//@ts-ignore 7016
import * as gCoffee from 'gulp-coffee';
import * as gts from 'gulp-typescript';
import uglify from 'gulp-uglify';
import through2 = require('through2');



import path = require('path');

export namespace Js {
  import Folder = Config.Folder;
  import config = Config.Config;
  import Types = Config.Types;
  import Source = Config.Source;
  import ErrnoException = NodeJS.ErrnoException;
  import myCallBack = Helper.myCallBack;
  import BuildModes = Helper.BuildModes;
  import creatGlob = Helper.creatGlob;
  declare const js = 'js';
  declare const coffee = 'coffee';
  declare const ts = 'ts';

  export class Tasks {

    private _gulp: Gulp;
    private config: config;
    private buildMode: BuildModes;
    private JS: Source;
    private Coffee: Source;
    private TS: Source;
    private JsGlob: { folder: Folder, glob: string[] }[];
    private CoffeeGlob: { folder: Folder, glob: string[] }[];
    private TsGlob: { folder: Folder, glob: string[] }[];

    constructor(_gulp: Gulp, _config: config, _buildMode: BuildModes) {
      this.config = _config;
      this._gulp = _gulp;
      this.buildMode = _buildMode;

      this.JS = this.config.Types.Scripts.Sources.find(type => type.Name.toLowerCase() === js);
      this.Coffee = this.config.Types.Scripts.Sources.find(
        type => type.Name.toLowerCase() === coffee
      );
      this.TS = this.config.Types.Scripts.Sources.find(
        type => type.Name.toLowerCase() === ts
      );
      _config.Folders.map((folder: Folder) => {
        if (folder.Types.indexOf(ts) !== -1 || folder.Types.indexOf(js) !== -1 || folder.Types.indexOf(coffee) !== -1) {
          if (this.JS !== undefined) {
            creatGlob(this.JS, folder).then((glob) => this.JsGlob.push({ folder, glob }));
          }
          if (this.TS !== undefined) {
            creatGlob(this.TS, folder).then((glob) => this.TsGlob.push({ folder, glob }));
          }
          if (this.Coffee !== undefined) {
            creatGlob(this.Coffee, folder).then((glob) => this.CoffeeGlob.push({ folder, glob }));
          }
        }
      });

    }
    public static isNeeded(config: Types) {
      const result = config.Scripts.Sources.find(value => {
        return value.Name.toLowerCase() === js ||
          value.Name.toLowerCase() === coffee ||
          value.Name.toLowerCase() === ts
          ? true
          : false;
      });
      return result !== undefined;
    }
    public BuildJsAll(): TaskFunction[] {
      let tasks;
      tasks = this.config.Folders.map(
        (folder: Folder) => {
          return this.BuildJS(folder);
        });
      return tasks;

    }
    private BuildJS(folder: Folder): TaskFunction {
      return (done) => new Promise<never>(() => {
        pipeline(
          [
            this.TS !== undefined ? this.buildTS(this.TS, folder) : through2.obj(),
            this.Coffee !== undefined
              ? this.buildCoffee(this.Coffee, folder)
              : through2.obj(),
            this.JS !== undefined
              ? this._gulp.src(
                this.JsGlob.find((value: { folder: Folder; }) => value.folder === folder).glob,
                this.buildMode === BuildModes.dev ? { sourcemaps: true } : null)
              : through2.obj(),
            babel({
              presets: ['@babel/env'],
              compact: true
            }),
            rename({ suffix: '.min' }),
            uglify(),
            this._gulp.dest(path.posix.join(folder.Dest + this.config.Types.Scripts ?? 'js'), this.buildMode === BuildModes.dev ? { sourcemaps: true } : null)
          ],
          (errnoException: ErrnoException) => done(new Error(errnoException.message))
        );
        done();
      });
    }
    private buildTS(TS: Config.Source, folder: Folder) {
      let tsProject: gts.Project | null;
      tsProject = gts.createProject(//TODO:  Maybe load tsconfig from cwd to have sourcemaps.
        folder.Src + TS.Src.toString() ?? 'tsconfig.json'
      );

      return pipeline(
        [tsProject.src(), tsProject().js],
        (errnoException: ErrnoException) => myCallBack(errnoException)
      );
    }
    private buildCoffee(Coffee: Config.Source, folder: Folder) {
      return pipeline(
        [
          this._gulp.src(
            this.CoffeeGlob.find((value: { folder: Folder; }) => value.folder === folder).glob,
            this.buildMode === BuildModes.dev ? { sourcemaps: true } : null
          ),
          gCoffee()//TODO: Find a way to load the compiler options for Coffee
        ],
        (errnoException: ErrnoException) => myCallBack(errnoException)
      );

    }
    public watch() {
      const toWatch: string[] = [];
      for (const index in this.JsGlob) {
        if (this.JsGlob.hasOwnProperty(index)) {
          toWatch.push(...this.JsGlob[index].glob);
        }
      }
      for (const index in this.TsGlob) {
        if (this.TsGlob.hasOwnProperty(index)) {
          toWatch.push(...this.TsGlob[index].glob);
        }
      }
      for (const index in this.CoffeeGlob) {
        if (this.CoffeeGlob.hasOwnProperty(index)) {
          toWatch.push(...this.CoffeeGlob[index].glob);

        }
      }
      return this._gulp.watch(toWatch, this.BuildJsAll);
    }


  }
}
