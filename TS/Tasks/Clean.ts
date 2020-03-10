import { Config, Helper, myTaskFunktion } from '../lib';
import del from 'del';

import { TaskFunction } from 'gulp';


export module Task {


  import buildModes = Helper.BuildModes;
  /**
   *
   *
   * @export
   * @class Clean
   */
  export class Clean  {
    private config: Config;
    private buildMode: buildModes;
    constructor(config: Config, buildMode: buildModes) {
      this.config = config;
      this.buildMode = buildMode;
    }


    /**
     *
     *
     * @returns {TaskFunction[]}
     * @memberof Clean
     */
    public clean(): TaskFunction[] {
      if (this.buildMode !== buildModes.dev) {
        console.log('clean swallowed since we are dev');
        return [];
      }
      const tasks: TaskFunction[] = [];
      this.getCleanpaths().then(value => {
          tasks.push(...value.map(this.cleanAll));
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
          del(cleanPath).then(value => console.log(value), reason => reject(reason));
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
    private getCleanpaths(): Promise<string[]> {
      return new Promise<string[]>((resolve, reject) => {
        const cleanPath: string[] = [];
        switch (this.buildMode) {
          case buildModes.release:
            cleanPath.push(this.config.Targets.Build.Path);
            break;
          case buildModes.ci:
            cleanPath.push(this.config.Targets.Ci.Path);
            break;
          default:
            reject('Path Could not be specif');
            break;
        }
        resolve(cleanPath);
      });
    }
  }
}
