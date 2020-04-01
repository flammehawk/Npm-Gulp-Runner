import path from 'path';
import { Source, Folder } from '../../config';
import { isArray, isUndefined } from 'util';

export type KeyedGlob<T> = { Key: T; Glob: string[] | Promise<string[]> };
export type KeyValuePair<T, K> = { Key: T; Value: K };

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
    const retVal = new Promise<KeyedGlob<T>>((resolve) =>
        resolve({ Key, Glob })
    );
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
    return Promise.all(Glob.map((value) => createKeyedGlob<T>(Key, value)));
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

function createGlobFromString(
    src: { Src: string; Exclude: string[] },
    folder: Folder
): string[] {
    const retValue: string[] = [];
    retValue.push(path.posix.join(folder.Src, src.Src));
    if (src?.Exclude?.length > 0) {
        retValue.push(
            ...src.Exclude.map((exclude) => {
                return '!' + exclude;
            })
        );
    }
    return retValue;
}

/**
 *
 * @param {Source} _Src the Source config that shall be used for the glob
 * @param {Folder} _folder The folder that shall be used for the glob
 * @returns {Promise<string[]>} the Promise for the created Glob
 */
export function creatGlob(_Src: Source, _folder: Folder): Promise<string[]> {
    return new Promise<string[]>((resolve) => {
        if (isArray(_Src.Src)) {
            createGlobFromArray(
                { Name: _Src.Name, Src: _Src.Src, Exclude: _Src.Exclude },
                _folder,
                resolve
            );
        } else {
            resolve(
                createGlobFromString(
                    { Src: _Src.Src, Exclude: _Src.Exclude },
                    _folder
                )
            );
        }
    });
}
function createGlobFromArray(
    _Src: { Name: string; Src: string[]; Exclude: string[] },
    _folder: Folder,
    resolve: (value?: string[] | PromiseLike<string[]>) => void
): void {
    Promise.all(
        _Src.Src.map((value) =>
            creatGlob(
                { Name: _Src.Name, Src: value, Exclude: _Src.Exclude },
                _folder
            )
        )
    ).then((value) => resolve([...flatten(value)]));
}

function getGlob(Glob: string[] | Promise<string[]> | undefined): string[] {
    if (isUndefined(Glob)) {
        return [];
    }
    let retValue: string[];
    Promise.resolve(Glob).then((value) => retValue.push(...value));
    return retValue;
}
export function getGlobFromKeyValuePair<T>(
    KeyValuePair: KeyValuePair<Folder, KeyedGlob<T>[]>,
    GlobKey: T
): string[] {
    return getGlob(
        KeyValuePair.Value.find((value) => value.Key === GlobKey)?.Glob
    );
}
export function getDestination(
    targetPath: string,
    folderPath: string,
    typePath: string
): string {
    return path.posix.join(targetPath, folderPath, typePath);
}
