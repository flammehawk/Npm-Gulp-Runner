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
    getGlobFromKeyValuePair,
    getDestination,
    Build,
} from '../lib';
import { TaskFunction, Gulp } from 'gulp';
import { pipeline } from 'stream';
import ErrnoException = NodeJS.ErrnoException;

import { FSWatcher } from 'fs';

/**
 *
 *
 * @export
 * @class Copy
 */
export class Copy {
    private _gulp: Gulp;

    private buildMode: BuildModes;
    private target: Build;
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
        this.target =
            this.buildMode === BuildModes.dev
                ? _config.Targets.Dev
                : this.buildMode === BuildModes.release
                ? _config.Targets.Build
                : _config.Targets.Ci;
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
        return (folder: Folder): KeyValuePair<Folder, KeyedGlob<Static>[]> => {
            return this.resolveStaticMap(statics, folder);
        };
    }

    private resolveStaticMap(
        statics: Static[],
        folder: Folder
    ): KeyValuePair<Folder, KeyedGlob<Static>[]> {
        const staticMapCallback = (
            folder: Folder
        ): ((value: Static) => Promise<KeyedGlob<Static>>) =>
            this.staticMapCallback(folder);
        let retValue: KeyValuePair<Folder, KeyedGlob<Static>[]>;
        Promise.all(statics.map(staticMapCallback(folder))).then(
            (value) => (retValue = { Key: folder, Value: value })
        );
        return retValue;
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
            return this.getTaskfunction(keyValuePair, watch);
        };
    }
    private getTaskfunction(
        keyValuePair: KeyValuePair<Folder, KeyedGlob<Static>[]>,
        watch: boolean
    ): TaskFunction {
        return this._gulp.parallel(
            ...keyValuePair.Value.map((value) => {
                return myTaskFunktion<void>(
                    new Promise<void>((resolve, reject) => {
                        pipeline(
                            this._gulp.src(
                                getGlobFromKeyValuePair(
                                    keyValuePair,
                                    value.Key
                                ),
                                this.getSrcOptions(watch)
                            ),
                            this._gulp.dest(
                                getDestination(
                                    this.target.Path,
                                    keyValuePair.Key.Dest,
                                    value.Key.Dest
                                )
                            ),
                            this.errorCallback(reject)
                        );
                        resolve();
                    })
                );
            })
        );
    }
    private getSrcOptions(watch: boolean): { since: number } | null {
        return watch
            ? {
                  since: this._gulp.lastRun(this.copy(true)),
              }
            : null;
    }

    private errorCallback(
        reject: (reason?: Error) => void
    ): (err: ErrnoException) => void {
        return (errnoException: ErrnoException): void => {
            reject(new Error(errnoException.message));
        };
    }

    private getPathes(): string[] {
        const pathes: string[] = [];
        this.copyGlob.forEach((keyValuePair) => {
            keyValuePair.Value.forEach((value) => {
                pathes.push(
                    ...getGlobFromKeyValuePair(keyValuePair, value.Key)
                );
            });
        });
        return pathes;
    }
}
