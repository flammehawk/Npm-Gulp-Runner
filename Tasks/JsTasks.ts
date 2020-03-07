///<reference path="./../gulpfile.ts"/>
import { Gulp } from 'gulp';
import { Helper } from '../lib';
import { Config } from '../lib/config';
import { pipeline, Duplex } from 'stream';
import { TaskFunction } from 'gulp';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
//@ts-ignore 7016
import * as gCoffee from 'gulp-coffee';
import * as gts from 'gulp-typescript';
import uglify from 'gulp-uglify';


import through2 = require('through2');
import { promisify } from 'util';

export namespace Js {
  import Folder = Config.Folder;
  import config = Config.Config;
  import Type = Config.Type;
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

    constructor(_gulp: Gulp, config: config, _buildMode: BuildModes) {
      this.config = config;
      this._gulp = _gulp;
      this.buildMode = _buildMode;
    }
    public static isNeeded(config: config) {
      const result = config.Types.find(value => {
        return value.Name.toLowerCase() === js ||
          value.Name.toLowerCase() === coffee ||
          value.Name.toLowerCase() === ts
          ? true
          : false;
      });
      return result !== undefined;
    }
     public BuildJsAll() {
      let tasks: TaskFunction[];
      tasks = this.config.Folders.map((folder: Folder) => {
        return promisify<never>((done)=> this.BuildJS(folder, done));
      });
      return this._gulp.parallel(...tasks);

    }
    private BuildJS(folder: Folder,done:(err:any, result:never)=>void) {
      const JS = this.config.Types.find(type => type.Name.toLowerCase() === js);
      const Coffee = this.config.Types.find(
        type => type.Name.toLowerCase() === coffee
      );
      const TS: Type = this.config.Types.find(
        type => type.Name.toLowerCase() === ts
      );

      return pipeline(
        [
          TS !== undefined ? this.buildTS(TS, folder) : through2.obj(),
          Coffee !== undefined
            ? this.buildCoffee(Coffee, folder)
            : through2.obj(),
            JS !== undefined ? this._gulp.src(creatGlob(JS,folder),this.buildMode === BuildModes.dev? {sourcemaps: true}:null): through2.obj(),
            babel( {
                presets: ['@babel/env'],
                compact: true
            } ),
            rename({ suffix: '.min' }),
            uglify(),
            this._gulp.dest(folder.Dest+TS?.Dest??Coffee?.Dest??JS?.Dest??'js/',this.buildMode === BuildModes.dev? {sourcemaps: true}:null)
        ],
        (errnoException: ErrnoException) => myCallBack(errnoException)
      );
    }
    private buildTS(TS: Type, folder: Folder) {
      let tsProject: gts.Project | null;

      tsProject = gts.createProject(
        folder.Src + TS.Src.toString() ?? 'tsconfig.json'
      );

      return pipeline( //TODO:  Maybe load tsconfig from cwd to have sourcemaps.
        [tsProject.src(), tsProject().js],
        (errnoException: ErrnoException) => myCallBack(errnoException)
      );
    }
    private buildCoffee(Coffee: Type, folder: Folder){
      return pipeline(
        [
          this._gulp.src(
            creatGlob(Coffee,folder),this.buildMode === BuildModes.dev? {sourcemaps: true}:null
          ),
          gCoffee()//TODO: Find a way to load the compiler options for Coffee
        ],
        (errnoException: ErrnoException) => myCallBack(errnoException)
      );

    }


  }
}
