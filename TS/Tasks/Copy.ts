import { Helper, Folder, Types, Static, Config, BuildModes, creatGlob, myTaskFunktion } from '../lib';
import { TaskFunction, Globs, Gulp } from 'gulp';
import { pipeline } from 'stream';
import { isArray } from 'util';

export module Task {

    import ErrnoException = NodeJS.ErrnoException;

    /**
     *
     *
     * @export
     * @class Copy
     */
    export class Copy {
        private _gulp: Gulp;
        private config: Config;
        private buildMode: BuildModes;
        private folders: Folder[];
        private types: Types;
        private copyGlob: { static: Static, glob: string[] }[];

        /**
         *Creates an instance of Copy.
         * @param {Gulp} _gulp
         * @param {Config} _config
         * @param {BuildModes} _buildMode
         * @memberof Copy
         */
        constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes) {
            this.config = _config;
            this.buildMode = _buildMode;
            this.copyGlob = [];
            this._gulp = _gulp;
            this.folders = _config.Folders;
            this.types = _config.Types;
            this.initCopyGlob();

        }

        /**
         *
         *
         * @private
         * @memberof Copy
         */
        private initCopyGlob() {
            this.folders.map(this.folderMapCallback,this);
        }


        /**
         *
         *
         * @private
         * @param {Folder} folder
         * @memberof Copy
         */
        private folderMapCallback(folder: Folder) {
            if (folder.Types.indexOf('Static') !== -1) {
                this.types.Static.map(this.staticMapCallback(folder),this);
            }
        }

        /**
         *
         *
         * @private
         * @param {Folder} folder
         * @returns {(value: Static, index: number, array: Static[]) => void}
         * @memberof Copy
         */
        private staticMapCallback(folder: Folder): (value: Static, index: number, array: Static[]) => void {
            return (source: Static) => {
                if (isArray(source.Src)) {
                    source.Src.map((src) => creatGlob({ Name: source.Name, Src: src, Exclude: source.Exclude }, folder)
                        .then((glob: string[]) => this.copyGlob.push({ static: source, glob: glob })));
                }
                else {
                    creatGlob({ Name: source.Name, Src: source.Src, Exclude: source.Exclude }, folder)
                        .then((glob: string[]) => this.copyGlob.push({ static: source, glob: glob }));
                }
            };
        }


        /**
         *
         *
         * @memberof Copy
         */
        public watch() {
            const toWatch: string[] = [];
            for (const index in this.copyGlob) {
                if (this.copyGlob.hasOwnProperty(index)) {
                    toWatch.push(...this.copyGlob[index].glob);
                }
            }
            this._gulp.watch(toWatch, this.copy(true));
        }

        /**
         *
         *
         * @private
         * @param {Static} _static
         * @returns
         * @memberof Copy
         */
        private getCleanSrc(_static: Static) {
            return this._gulp.src(this.copyGlob.find((value) => value.static === _static).glob);
        }

        /**
         *
         *
         * @private
         * @param {Static} _static
         * @returns
         * @memberof Copy
         */
        private getCleanIncrementalSrc(_static: Static) {
            return this._gulp.src(this.copyGlob.find((value) => value.static === _static).glob, { since: this._gulp.lastRun(this.copy(true)) });
        }

        /**
         *
         *
         * @param {boolean} [watch=false]
         * @returns {TaskFunction}
         * @memberof Copy
         */
        public copy(watch: boolean = false): TaskFunction {
            const tasks: TaskFunction[] = [];
            for (const index in this.config.Folders) {
                if (!this.config.Folders.hasOwnProperty(index)) {
                    continue;
                }
                tasks.push(... this.mapStaticTasks(watch, index));

            }
            return this._gulp.parallel(tasks);
        }


        /**
         *
         *
         * @private
         * @param {boolean} watch
         * @param {string} index
         * @returns {TaskFunction[]}
         * @memberof Copy
         */
        private mapStaticTasks(watch: boolean, index: string):TaskFunction[] {
            return this.config.Types.Static.map(
                (_static) => {
                    return myTaskFunktion<void>(
                        new Promise<void>((resolve, reject) => {
                            pipeline([
                                watch ? this.getCleanSrc(_static) : this.getCleanIncrementalSrc(_static),
                                this._gulp.dest(this.config.Folders[index].Dest)
                            ], (errnoException: ErrnoException) => reject(new Error(errnoException.message)));
                            resolve();
                        }));
                });
        }
    }
}