import path from 'path';
import { Source, Folder } from '../../config';
import { isArray } from 'util';

export module GlobHandler {
  export type KeyedGlob<T> = { Key: T; Glob: string[] | Promise<string[]> };

  /**
   * Creates keyed glob
   * @template T
   * @param Key
   * @param Glob
   * @returns keyed glob
   */
  export function createKeyedGlob<T>(
    Key: T,
    Glob: string[] | Promise<string[]>
  ): Promise<KeyedGlob<T>> {
    const retVal = new Promise<KeyedGlob<T>>(resolve => resolve({ Key, Glob }));
    return retVal;
  }

  /**
   * Creates keyed glob array
   * @template T
   * @param Key
   * @param Glob
   * @returns keyed glob array
   */
  export function createKeyedGlobArray<T>(
    Key: T,
    Glob: Promise<string[]>[]
  ): Promise<KeyedGlob<T>[]> {
    return Promise.all(Glob.map(value => createKeyedGlob<T>(Key, value)));
  }

  export function* flatten<T>(arr: T): Generator<string, void, void> {
    if (Array.isArray(arr)) {
      for (const el of arr) {
        if (Array.isArray(el)) {
          yield* flatten(el);
        } else {
          yield el;
        }
      }
    }
  }

  /**
   *
   * @param {Source} _Src the Source config that shall be used for the glob
   * @param {Folder} _folder The folder that shall be used for the glob
   * @returns {Promise<string[]>} the Promise for the created Glob
   */
  export function creatGlob(_Src: Source, _folder: Folder): Promise<string[]> {
    return new Promise<string[]>(resolve => {
      if (isArray(_Src.Src)) {
        Promise.all(
          _Src.Src.map(value =>
            creatGlob(
              { Name: _Src.Name, Src: value, Exclude: _Src.Exclude },
              _folder
            )
          )
        ).then(value => resolve([...flatten(value)]));
      } else {
        const retValue: string[] = [];
        retValue.push(path.posix.join(_folder.Src, _Src.Src));
        if (_Src?.Exclude?.length > 0) {
          retValue.push(
            ..._Src.Exclude.map(exclude => {
              return '!' + exclude;
            })
          );
        }
        resolve(retValue);
      }
    });
  }
}
