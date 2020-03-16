import { TaskFunction } from 'gulp';

import ErrnoException = NodeJS.ErrnoException;

/**
 * Generall Helper Modul
 */
export module Helper {
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
    return done => {
      execute
        .catch(reason => {
          console.error(reason.ToString());
          done(new Error(reason.ToString()));
        })
        .finally(() => done());
    };
  }

  export type Json = string | null | { [property: string]: Json } | Json[];

  /**
   *
   *
   * @export
   * @enum {number}
   */
  export enum BuildModes {
    dev = 0,
    release,
    ci
  }
}
