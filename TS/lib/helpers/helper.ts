import { Globs } from 'gulp';
import { Config } from './../index';
import ErrnoException = NodeJS.ErrnoException;
import path = require('path');

export module Helper {
  import Source = Config.Source;
  import Folder = Config.Folder;
  export function myCallBack(errnoException: ErrnoException): void {
    if (errnoException) {
      console.error(errnoException);
      errnoException.message;
    } else {
    }
  }
  export type Json = string | null | { [property: string]: Json } | Json[];
  export enum BuildModes {
    dev = 0,
    release,
    ci
  }
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
