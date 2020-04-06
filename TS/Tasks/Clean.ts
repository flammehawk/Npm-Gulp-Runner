import { Config, BuildModes, myTaskFunktion, Source } from '../lib';
import del from 'del';

import { TaskFunction } from 'gulp';
import { BaseTask } from './BaseTask';

/**
 *
 *
 * @export
 * @class Clean
 */
export class Clean extends BaseTask<Source> {
    constructor(config: Config, buildMode: BuildModes) {
        super(null, buildMode);
        super.init(config);
    }

    /**
     *
     *
     * @returns {TaskFunction[]}
     * @memberof Clean
     */
    public clean(): TaskFunction[] {
        let tasks: TaskFunction[] = [];
        const BoundCleanAll = (cleanPath: string): TaskFunction =>
            this.cleanAll(cleanPath);
        this.getCleanpaths().then((value) => {
            tasks.push(BoundCleanAll(value));
        });
        if (this.buildMode !== BuildModes.dev) {
            console.log('clean swallowed since we are dev');
            tasks = [];
        }
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
        return new Promise<string>((resolve) => {
            resolve(this.target.Path);
        });
    }
}
