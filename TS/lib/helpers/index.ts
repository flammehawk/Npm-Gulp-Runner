import { TaskFunction } from 'gulp';
import {
    KeyedGlob,
    KeyValuePair,
    creatGlob,
    createKeyedGlob,
    createKeyedGlobArray,
    flatten,
    getDestination,
    getGlobFromKeyValuePair,
} from './GlobHandler';

import ErrnoException = NodeJS.ErrnoException;
import { Source } from '../config';

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

export {
    KeyedGlob,
    KeyValuePair,
    creatGlob,
    createKeyedGlob,
    createKeyedGlobArray,
    flatten,
    getGlobFromKeyValuePair,
    getDestination,
};
