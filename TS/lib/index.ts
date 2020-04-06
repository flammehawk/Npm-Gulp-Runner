import {
    BuildModes,
    myTaskFunktion,
    creatGlob,
    KeyedGlob,
    KeyValuePair,
    createKeyedGlob,
    flatten,
    myCallBack,
    getGlobFromKeyValuePair,
    getDestination,
    findSource,
    Json,
    folderTypeFilter,
    getTarget,
    MappedFolder,
    mapFolder,
} from './helpers';
import { GulpClient } from './gulp';
import {
    Config,
    Folder,
    Source,
    Scripts as Settings,
    Types,
    Static,
    Convert,
    Build,
} from './config';

export type GulpStream =
    | NodeJS.ReadWriteStream
    | NodeJS.ReadableStream
    | NodeJS.WritableStream;
export {
    Json,
    BuildModes,
    creatGlob,
    GulpClient,
    Config,
    Settings,
    Types,
    Static,
    Folder,
    Source,
    Convert,
    myTaskFunktion,
    KeyedGlob,
    KeyValuePair,
    createKeyedGlob,
    flatten,
    myCallBack,
    getGlobFromKeyValuePair,
    getDestination,
    findSource,
    folderTypeFilter,
    Build,
    getTarget,
    MappedFolder,
    mapFolder,
};
