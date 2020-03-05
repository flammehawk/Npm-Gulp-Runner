import { Config } from './config/Config';
import {GulpClient} from './lib';





export module Tasks {

    import Gulp = GulpClient.Gulp;
    import TaskFunction = GulpClient.TaskFunction;
    export class GulpRunner {

        private config: Config.Config;
        private _gulp: Gulp;
        private isDev:boolean;

        constructor(_gulp: Gulp, _configJson: object) {
            this._gulp = _gulp;
            this.config = Config.Convert.toConfig(_configJson.toString());
        }

        Build(done:TaskFunction){
            if(ScssTasks.isNeeded)

            done(null);
        }
    }
}

