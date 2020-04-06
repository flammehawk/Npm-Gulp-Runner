import { TaskFunction } from 'gulp';
import {
    KeyedGlob,
    KeyValuePair,
    creatGlob,
    createKeyedGlob,
    flatten,
    getDestination,
    getGlobFromKeyValuePair,
    MappedFolder,
    mapFolder,
} from './GlobHandler';

import ErrnoException = NodeJS.ErrnoException;
import { Source, Folder, Config, Build } from '../config';

/**
 *
 *
 * @export
 * @param {ErrnoException} errnoException
 */
export function myCallBack(errnoException: ErrnoException): void {
    if (errnoException) {
        console.error(errnoException);
        errnoException.message;
    }
}

/**
 *
 *
 * @export
 * @template T
 * @param {Promise<T>} execute
 * @returns {TaskFunction}
 */
export function myTaskFunktion<T>(execute: Promise<T>): TaskFunction {
    return (done): void => {
        execute
            .catch((reason) => {
                console.error(reason.ToString());
                done(new Error(reason.ToString()));
            })
            .finally(() => done());
    };
}

export type Json = string | null | { [property: string]: Json } | Json[];

export function findSource(sourceName: string): (value: Source) => boolean {
    return (value): boolean => value.Name.toLowerCase() === sourceName;
}
function checkForTypes(folder: Folder, types: string[]): boolean {
    let retVal: boolean;
    for (const type of types) {
        retVal = retVal || folder.Types.includes(type);
    }
    return retVal;
}
export function folderTypeFilter(
    types: string[]
): (folders: Folder) => boolean {
    return (folder: Folder): boolean => {
        return checkForTypes(folder, types);
    };
}

/**
 *
 *
 * @export
 * @enum {number}
 */
export enum BuildModes {
    dev = 0,
    release,
    ci,
}

export function getTarget(_config: Config, buildMode: BuildModes): Build {
    return buildMode === BuildModes.dev
        ? _config.Targets.Dev
        : buildMode === BuildModes.release
        ? _config.Targets.Build
        : _config.Targets.Ci;
}

export {
    KeyedGlob,
    KeyValuePair,
    creatGlob,
    createKeyedGlob,
    flatten,
    getGlobFromKeyValuePair,
    getDestination,
    MappedFolder,
    mapFolder,
};
