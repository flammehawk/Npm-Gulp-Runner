import * as GlobWatcher from 'glob-watcher';
import * as fs from 'fs';
import Gulp = require('Gulp');

declare namespace GulpClient {
    interface WatchMethod {
        /**
         * Watch globs and execute a function upon change, with intelligent defaults for debouncing and queueing.
         * @param globs Takes a glob string or an array of glob strings as the first argument.
         * Globs are executed in order, so negations should follow positive globs
         * fs.src(['!b*.js', '*.js']) would not exclude any files, but this would: fs.src(['*.js', '!b*.js'])
         */
        GlobWatcher(
            globs: Gulp.Globs,
            opt?: GlobWatcher.WatchOptions,
            cb?: Gulp.TaskFunction | (() => GlobWatcher.AsyncType)
        ): fs.FSWatcher;

        /**
         * Watch globs and execute a function upon change, with intelligent defaults for debouncing and queueing.
         * @param globs Takes a glob string or an array of glob strings as the first argument.
         * Globs are executed in order, so negations should follow positive globs
         * fs.src(['!b*.js', '*.js']) would not exclude any files, but this would: fs.src(['*.js', '!b*.js'])
         */
        GlobWatcher(
            globs: Gulp.Globs,
            cb?: Gulp.TaskFunction | (() => GlobWatcher.AsyncType)
        ): fs.FSWatcher;
    }
}
