import {
    Folder,
    Static,
    Config,
    BuildModes,
    myTaskFunktion,
    KeyedGlob,
    KeyValuePair,
    createKeyedGlob,
    creatGlob,
} from '../lib';
import { TaskFunction, Gulp } from 'gulp';
import { pipeline } from 'stream';
import ErrnoException = NodeJS.ErrnoException;
import path from 'path';
import { FSWatcher } from 'fs';
import { getGlob } from '../lib/helpers/GlobHandler';

/**
 *
 *
 * @export
 * @class Copy
 */
export class Copy {
    private _gulp: Gulp;

    private buildMode: BuildModes;
    private folders: Folder[];
    private statics: Static[];
    private readonly copyGlob: KeyValuePair<Folder, KeyedGlob<Static>[]>[];

    /**
     *Creates an instance of Copy.
     * @param {Gulp} _gulp
     * @param {Config} _config
     * @param {BuildModes} _buildMode
     * @memberof Copy
     */
    constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes) {
        this.buildMode = _buildMode;
        this._gulp = _gulp;
        const folders = _config.Folders.filter((value) =>
            value.Types.includes('static')
        );
        const statics = _config.Types.Static;
        this.copyGlob = this.initCopyGlob(folders, statics);
    }

    /**
     *
     *
     * @private
     * @memberof Copy
     */
    private initCopyGlob(
        folders: Folder[],
        statics: Static[]
    ): KeyValuePair<Folder, KeyedGlob<Static>[]>[] {
        const folderMapCallback = (
            statics: Static[]
        ): ((value: Folder) => KeyValuePair<Folder, KeyedGlob<Static>[]>) =>
            this.folderMapCallback(statics);

        return folders.map(folderMapCallback(statics));
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @memberof Copy
     */
    private folderMapCallback(
        statics: Static[]
    ): (value: Folder) => KeyValuePair<Folder, KeyedGlob<Static>[]> {
        const staticMapCallback = (
            folder: Folder
        ): ((value: Static) => Promise<KeyedGlob<Static>>) =>
            this.staticMapCallback(folder);
        return (folder: Folder): KeyValuePair<Folder, KeyedGlob<Static>[]> => {
            let retValue: KeyValuePair<Folder, KeyedGlob<Static>[]>;
            Promise.all(statics.map(staticMapCallback(folder))).then(
                (value) => (retValue = { Key: folder, Value: value })
            );
            return retValue;
        };
    }

    /**
     *
     *
     * @private
     * @param {Folder} folder
     * @returns {(value: Static, index: number, array: Static[]) => void}
     * @memberof Copy
     */
    private staticMapCallback(
        folder: Folder
    ): (value: Static) => Promise<KeyedGlob<Static>> {
        return (value: Static): Promise<KeyedGlob<Static>> =>
            createKeyedGlob(value, creatGlob(value, folder));
    }

    /**
     *
     *
     * @memberof Copy
     */
    public watch(): FSWatcher {
        return this._gulp.watch(this.getPathes(), this.copy(true));
    }

    /**
     *
     *
     * @param {boolean} [watch=false]
     * @returns {TaskFunction}
     * @memberof Copy
     */
    public copy(watch = false): TaskFunction {
        return this._gulp.parallel(
            ...this.copyGlob.map(this.mapStaticTasks(watch))
        );
    }

    /**
     *
     *
     * @private
     * @param {boolean} watch
     * @param {string} index
     * @returns {(keyValuePair: KeyValuePair<Folder, KeyedGlob<Static>[]>)=> TaskFunction[]}
     * @memberof Copy
     */
    private mapStaticTasks(
        watch: boolean
    ): (
        keyValuePair: KeyValuePair<Folder, KeyedGlob<Static>[]>
    ) => TaskFunction {
        return (
            keyValuePair: KeyValuePair<Folder, KeyedGlob<Static>[]>
        ): TaskFunction => {
            const retValue = keyValuePair.Value.map((value) => {
                const glob: string[] = [];
                glob.push(...getGlob(value.Glob));
                return myTaskFunktion<void>(
                    new Promise<void>((resolve, reject) => {
                        pipeline(
                            this._gulp.src(
                                glob,
                                watch
                                    ? {
                                          since: this._gulp.lastRun(
                                              this.copy(true)
                                          ),
                                      }
                                    : null
                            ),
                            this._gulp.dest(
                                path.posix.join(
                                    keyValuePair.Key.Dest,
                                    value.Key.Dest
                                )
                            ),
                            (errnoException: ErrnoException) => {
                                return reject(
                                    new Error(errnoException.message)
                                );
                            }
                        );
                        resolve();
                    })
                );
            });
            return this._gulp.parallel(...retValue);
        };
    }

    private getPathes(): string[] {
        const pathes: string[] = [];
        this.copyGlob.forEach((value) => {
            value.Value.forEach((value) => {
                pathes.push(...getGlob(value.Glob));
            });
        });
        return pathes;
    }
}
