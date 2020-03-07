import { TaskFunction } from 'gulp';
import { Config } from './../index';

import ErrnoException = NodeJS.ErrnoException;
import { promises } from 'dns';

export module Helper {
  import Type = Config.Type;
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
    dev = 1,
    release,
    ci
  }
  export function creatGlob(type: Type, folder: Folder) {
    return Array.isArray(type.Src)
      ? (type.Src as Array<string>).map(value => {
          return folder.Src.concat(value);
        })
      : folder.Src.concat(type.Src);
  }
}
