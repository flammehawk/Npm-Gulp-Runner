import { Helper, Config, BuildModes, creatGlob } from './../lib';
import { TaskFunction, Globs, Gulp } from 'gulp';
import { pipeline } from 'stream';
import { isArray } from 'util';

export namespace Copy {
    import config = Config.Config;
    import Folder = Config.Folder;
    import Types = Config.Types;
    import ErrnoException = NodeJS.ErrnoException;
    export class Task {
        private _gulp: Gulp;
        private config: config;
        private buildMode: BuildModes;
        private folders: Folder;
        private copyGlob: string[];
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
                                .then((glob: string[]) => this.copyGlob.push(...glob)));
                        }
                        else {
                            creatGlob({ Name: source.Name, Src: source.Src, Exclude: source.Exclude }, folder)
                                .then((glob: string[]) => this.copyGlob.push(...glob));
                        }
                    });
                }
            });
        }
        public copy(): TaskFunction {
            return this._gulp.parallel(this.config.Folders.map((folder) => {
                return (done: (err?: Error) => void) => {
                    pipeline([
                        this._gulp.src(this.copyGlob),
                        this._gulp.dest(folder.Dest)
                    ], (errnoException: ErrnoException) => done(new Error(errnoException.message)));
                    done();
                };
            }));
        }
    }
}