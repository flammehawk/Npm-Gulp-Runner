import { Config, Helper, BuildModes } from '../lib';
import { TaskFunction, Gulp } from 'gulp';


/**
 *
 */
declare module Tasks {

    /**
     * Clean
     */
    export class Clean {

        /**
         * Creates an instance of clean.
         * @param config
         * @param buildMode
         */
        constructor(config: Config, buildMode: Helper.BuildModes);

        /**
         * Cleans clean
         * @returns {TaskFunction[]} clean
         */
        public clean(): TaskFunction[];
    }

    /**
     * Copy
     */
    export class Copy {

        /**
         * Creates an instance of copy.
         * @param _gulp
         * @param _config
         * @param _buildMode
         */
        constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes);

        /**
         *  Copy´s the static files
         * @returns copy
         */
        public copy(): TaskFunction;

        /**
         * Watch´s the static files
         * @returns Never
         */
        public watch(): void;
    }

    /**
     *  Css
     */
    export class Styles {

        /**
         * Creates an instance of css.
         * @param _gulp
         * @param _config
         * @param _buildMode
         */
        constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes);

        /**
         * Determines whether the Css Tasks are needed.
         * @param config
         * @returns true if needed
         */
        public static isNeeded(config: Config): boolean;

        /**
         * Builds all Style files
         * @param  {boolean} [watch] default false
         * @returns scss all
         */
        public BuildScssAll(watch: boolean = false): TaskFunction[];

        /**
         * Watch's Styles for changes
         */
        public watch();
    }

    /**
     * Js
     */
    export class Scripts {

        /**
         * Creates an instance of js.
         * @param _gulp
         * @param _config
         * @param _buildMode
         */
        constructor(_gulp: Gulp, _config: Config, _buildMode: BuildModes);

        /**
         * Determines whether needed is
         * @param types
         * @returns true if needed
         */
        public static isNeeded(types: Types): boolean;

        /**
         * Builds js all
         * @returns js all
         */
        public BuildJsAll(): TaskFunction[];

        /**
         * Watch's js
         */
        public watch();
    }
}