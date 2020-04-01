import { Config, BuildModes, myTaskFunktion, Build } from '../lib';
import del from 'del';

import { TaskFunction } from 'gulp';

/**
 *
 *
 * @export
 * @class Clean
 */
export class Clean {
    private buildMode: BuildModes;
    private target: Build;
    constructor(config: Config, buildMode: BuildModes) {
        this.buildMode = buildMode;
        this.target =
            this.buildMode === BuildModes.dev
                ? config.Targets.Dev
                : this.buildMode === BuildModes.release
                ? config.Targets.Build
                : config.Targets.Ci;
    }

    /**
     *
     *
     * @returns {TaskFunction[]}
     * @memberof Clean
     */
    public clean(): TaskFunction[] {
        if (this.buildMode !== BuildModes.dev) {
            console.log('clean swallowed since we are dev');
            return [];
        }
        const tasks: TaskFunction[] = [];
        const BoundCleanAll = (cleanPath: string): TaskFunction =>
            this.cleanAll(cleanPath);
        this.getCleanpaths().then((value) => {
            tasks.push(BoundCleanAll(value));
        });
        return tasks;
    }

    /**
     *
     *
     * @private
     * @param {string} cleanPath
     * @returns {TaskFunction}
     * @memberof Clean
     */
    private cleanAll(cleanPath: string): TaskFunction {
        return myTaskFunktion<never>(
            new Promise<never>((reject) => {
                del(cleanPath).then(
                    (value) => console.log(value),
                    (reason) => reject(reason)
                );
            })
        );
    }

    /**
     *
     *
     * @private
     * @returns {Promise<string[]>}
     * @memberof Clean
     */
    private getCleanpaths(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            resolve(this.target.Path);
        });
    }
}
