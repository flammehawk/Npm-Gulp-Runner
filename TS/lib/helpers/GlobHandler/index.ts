import path from 'path';
import { Source, Folder } from '../../config';
import { isArray, isUndefined } from 'util';

const mapExcludeToGlob = (exclude: string): string => '!' + exclude;
const getExludeMapIfNeeded = (exclude: string[]): string[] | null =>
    exclude?.map(mapExcludeToGlob) ?? null;
const stringIsNotNull = (value: string): boolean => value !== null;

function createGlobFromString(
    src: { Src: string; Exclude: string[] },
    folder: Folder
): string[] {
    const retValue: string[] = [];
    retValue.push(path.posix.join(folder.Src, src.Src));
    retValue.push(...getExludeMapIfNeeded(src.Exclude));

    return retValue.filter(stringIsNotNull);
}
function getFlattendGlobFromArray(
    _Src: { Name: string; Src: string[]; Exclude: string[] },
    _folder: Folder
): string[] | PromiseLike<string[]> {
    return [
        ...flatten(
            createGlobFromArray(_Src, _folder).map(resolverStringArrayPromise)
        ),
    ];
}

function createGlobFromArray(
    _Src: { Name: string; Src: string[]; Exclude: string[] },
    _folder: Folder
): Promise<string[]>[] {
    return _Src.Src.map(mapCallback(_Src, _folder));
}

function resolverStringArrayPromise(promise: Promise<string[]>): string[] {
    let retVal: string[];
    promise.then((value) => (retVal = value));
    return retVal;
}

function mapCallback(
    _Src: { Name: string; Src: string[]; Exclude: string[] },
    _folder: Folder
) {
    return (value: string): Promise<string[]> =>
        creatGlob(
            { Name: _Src.Name, Src: value, Exclude: _Src.Exclude },
            _folder
        );
}

function sourceMap<T extends Source>(
    source: T,
    folder: Folder
): Promise<KeyedGlob<T>> {
    let retValue: Promise<KeyedGlob<T>> = null;
    if (source) {
        retValue = createKeyedGlob(this.JS, creatGlob(this.JS, folder));
    }
    return retValue;
}
function resolveTempKeyedGlobArray<T extends Source>(
    tempKeyedGlobArray: Promise<KeyedGlob<T>>[],
    folder: Folder
): MappedFolder<T> {
    let retValue: MappedFolder<T>;
    Promise.all(tempKeyedGlobArray).then(
        (value) => (retValue = { Key: folder, Value: value })
    );
    return retValue;
}

function getGlob(Glob: string[] | Promise<string[]> | undefined): string[] {
    if (isUndefined(Glob)) {
        return [];
    }
    let retValue: string[];
    Promise.resolve(Glob).then((value) => retValue.push(...value));
    return retValue;
}

//#region exported
export type KeyedGlob<T> = { Key: T; Glob: string[] | Promise<string[]> };
export type KeyValuePair<T, K> = { Key: T; Value: K };
export type MappedFolder<T> = KeyValuePair<Folder, KeyedGlob<T>[]>;
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
    return new Promise<string[]>((resolve) => {
        if (isArray(_Src.Src)) {
            resolve(
                getFlattendGlobFromArray(
                    {
                        Name: _Src.Name,
                        Src: _Src.Src,
                        Exclude: _Src.Exclude,
                    },
                    _folder
                )
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

export function mapFolder<T extends Source>(
    folder: Folder,
    sources: T[]
): MappedFolder<T> {
    const boundSourceMap = (source: T): Promise<KeyedGlob<T>> => {
        return sourceMap(source, folder);
    };

    const tempKeyedGlobArray: Promise<KeyedGlob<T>>[] = sources
        .map(boundSourceMap)
        .filter((value) => value !== null);

    return resolveTempKeyedGlobArray(tempKeyedGlobArray, folder);
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
//#endregion
