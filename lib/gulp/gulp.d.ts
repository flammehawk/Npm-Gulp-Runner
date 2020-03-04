import * as vfs from "vinyl-fs";
import * as Undertaker from "undertaker";
import * as GlobWatcher from "glob-watcher";
import * as fs from "fs";

declare namespace GulpClient {


    /**
     * @summary A glob is a string of literal and/or wildcard characters used to match filepaths. Globbing is the act of locating files on a filesystem using one or more globs.
     */
    type Globs = string | string[];

    type TaskFunction = Undertaker.TaskFunction;

    interface Gulp extends Undertaker {
        /**
         * Emits files matching provided glob or array of globs. Returns a stream of Vinyl files that can be piped to plugins.
         * @param globs Glob or array of globs to read.
         * @param options Options to pass to node-glob through glob-stream.
         */
        src: SrcMethod;

        /**
         * Can be piped to and it will write files. Re-emits all data passed to it so you can pipe to multiple folders.
         * Folders that don't exist will be created.
         * @param path The path (output folder) to write files to. Or a function that returns it, the function will be provided a vinyl File instance.
         */
        dest: DestMethod;

        /**
         * Functions exactly like gulp.dest, but will create symlinks instead of copying a directory.
         * @param folder A folder path or a function that receives in a file and returns a folder path.
         */
        symlink: SymlinkMethod;

    }

    interface WatchMethod {

        /**
         * Watch globs and execute a function upon change, with intelligent defaults for debouncing and queueing.
         * @param globs Takes a glob string or an array of glob strings as the first argument.
         * Globs are executed in order, so negations should follow positive globs
         * fs.src(['!b*.js', '*.js']) would not exclude any files, but this would: fs.src(['*.js', '!b*.js'])
         */
        GlobWatcher(globs: Globs, opt?: GlobWatcher.WatchOptions, cb?:TaskFunction | (() => GlobWatcher.AsyncType)): fs.FSWatcher;

        /**
         * Watch globs and execute a function upon change, with intelligent defaults for debouncing and queueing.
         * @param globs Takes a glob string or an array of glob strings as the first argument.
         * Globs are executed in order, so negations should follow positive globs
         * fs.src(['!b*.js', '*.js']) would not exclude any files, but this would: fs.src(['*.js', '!b*.js'])
         */
        GlobWatcher(globs: Globs, cb?: TaskFunction | (() => GlobWatcher.AsyncType)): fs.FSWatcher;


    }


    type SrcMethod = typeof vfs.src;

    type DestMethod = typeof vfs.dest;

    type SymlinkMethod = typeof vfs.symlink;

}
declare const gulpClient : GulpClient.Gulp

export = gulpClient;


