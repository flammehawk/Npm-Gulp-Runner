import { Globs, TaskFunction } from 'gulp';
import {Folder,Source  } from '../index';
import ErrnoException = NodeJS.ErrnoException;
import path = require('path');

/**
 * Generall Helper Modul
 */
export module Helper {


  /**
   *
   * @param {ErrnoException} errnoException The error that get thrown by Pipeline
   */
  export function myCallBack(errnoException: ErrnoException): void {
    if (errnoException) {
      console.error(errnoException);
      errnoException.message;
    }
  }

export function myTaskFunktion<T>(execute:Promise<T>):TaskFunction{
  return (done)=> {
    execute.catch(reason=> {
      console.error(reason.ToString());
      done(new Error(reason.ToString()));
    }).finally(()=>done());
  };
}

  export type Json = string | null | { [property: string]: Json } | Json[];

  export enum BuildModes {
    dev = 0,
    release,
    ci
  }
  /**
   *
   * @param {Source} _Src the Source config that shall be used for the glob
   * @param {Folder} _folder The folder that shall be used for the glob
   * @returns {Promise<string[]>} the Promise for the created Glob
   */
  export function creatGlob(_Src: Source, _folder: Folder): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
      const retValue: string[] = [];
      retValue.push(path.posix.join(_folder.Src, _Src.Src));
      if (_Src?.Exclude?.length > 0) {
        retValue.push(..._Src.Exclude.map(
          (exclude => {
            return '!' + exclude;
          })));
      }
      resolve(retValue);
    });

  }
}
