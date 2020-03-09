import { Helper, Config, BuildModes, creatGlob } from './../lib';
import { TaskFunction, Globs, Gulp } from 'gulp';
import { pipeline } from 'stream';
import { isArray } from 'util';

export namespace Copy {
    import config = Config.Config;
    import Folder = Config.Folder;
    import Types = Config.Types;
    import Static = Config.Static;
    import ErrnoException = NodeJS.ErrnoException;
    export class Task {
        private _gulp: Gulp;
        private config: config;
        private buildMode: BuildModes;
        private folders: Folder;
        private copyGlob: { static:Static, glob:string[]}[];
        constructor(_gulp: Gulp, _config: config, _buildMode: BuildModes) {
            this.config = _config;
            this.buildMode = _buildMode;
            this.copyGlob = [];
            this._gulp = _gulp;

            _config.Folders.map((folder: Folder) => {
                if (folder.Types.indexOf('Static') !== -1) {
                    _config.Types.Static.map((source) => {
                        if (isArray(source.Src)) {
                            source.Src.map((value) => creatGlob({ Name: source.Name, Src: value, Exclude: source.Exclude }, folder)
                                .then((glob: string[]) => this.copyGlob.push({static:source, glob:glob })));
                        }
                        else {
                            creatGlob({ Name: source.Name, Src: source.Src, Exclude: source.Exclude }, folder)
                                .then((glob: string[]) => this.copyGlob.push({static:source, glob:glob }));
                        }
                    });
                }
            });
        }
        /**
        * @returns {TaskFunction} A TaskFunctions to be used with Gulp
        */
        public copy(): TaskFunction {
            const tasks:TaskFunction[]=[];
            for (const index in this.config.Folders) {
                if (this.config.Folders.hasOwnProperty(index)) {
                    this.config.Types.Static.map((_static)=> {
                        return (done: (err?: Error) => void) => {
                            pipeline([
                                this._gulp.src(this.copyGlob.find((value)=> value.static===_static ).glob),
                                this._gulp.dest(this.config.Folders[index].Dest)
                            ], (errnoException: ErrnoException) => done(new Error(errnoException.message)));
                            done();
                        };
                    });
                }
            }
            return this._gulp.parallel(tasks);
        }
        private copyIncremental(): TaskFunction {
            const tasks:TaskFunction[]=[];
            for (const index in this.config.Folders) {
                if (this.config.Folders.hasOwnProperty(index)) {
                    this.config.Types.Static.map((_static)=> {
                        return (done: (err?: Error) => void) => {
                            pipeline([
                                this._gulp.src(this.copyGlob.find((value)=> value.static===_static ).glob,{since:this._gulp.lastRun(this.copyIncremental)}),
                                this._gulp.dest(this.config.Folders[index].Dest)
                            ], (errnoException: ErrnoException) => done(new Error(errnoException.message)));
                            done();
                        };
                    });
                }
            }
            return this._gulp.parallel(tasks);
        }
        /**
        * Activates the Watch for changes of the scripts.
        */
        public watch(){
            const toWatch: string[] = [];
            for (const index in this.copyGlob) {
              if (this.copyGlob.hasOwnProperty(index)) {
                toWatch.push(...this.copyGlob[index].glob);
              }
            }
            this._gulp.watch(toWatch, this.copyIncremental);
        }
    }
}