/* eslint-disable */
/**
 * @description File to parse the provided Config Json
 *
 *  Generated using Quicktype
 * @see https://app.quicktype.io
 *
 *
 *
 *
 */
// To parse this data:
//
//   import { Convert, Config } from "./file";
//
//   const config = Convert.toConfig(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.
// cSpell:disable
// eslint:disable

export interface Config {
    Targets: Targets;
    Types: Types;
    Folders: Folder[];
}

export interface Folder extends Static {
    Types: string[];
    Src: string;
}

export interface Targets {
    Dev: Build;
    Build: Build;
    Ci: Build;
}

export interface Build {
    Slug: string;
    Path: string;
}

export interface Types {
    Styles: Scripts;
    Scripts: Scripts;
    Static: Static[];
}

export interface Scripts {
    Sources: Source[];
    Destination: string;
}

export interface Source {
    Name: string;
    Src: string | string[];
    Exclude: string[];
}

export interface Static extends Source {
    Dest: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toConfig(json: string): Config {
        return cast(JSON.parse(json), r('Config'));
    }

    public static configToJson(value: Config): string {
        return JSON.stringify(uncast(value, r('Config')), null, 2);
    }
}

function invalidValue(typ: any, val: any): never {
    throw Error(
        `Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`
    );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        var map: any = {};
        typ.props.forEach(
            (p: any) => (map[p.json] = { key: p.js, typ: p.typ })
        );
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        var map: any = {};
        typ.props.forEach(
            (p: any) => (map[p.js] = { key: p.json, typ: p.typ })
        );
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        var l = typs.length;
        for (var i = 0; i < l; i++) {
            var typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue('array', val);
        return val.map((el) => transform(el, typ, getProps));
    }

    function transformDate(typ: any, val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue('Date', val);
        }
        return d;
    }

    function transformObject(
        props: { [k: string]: any },
        additional: any,
        val: any
    ): any {
        if (val === null || typeof val !== 'object' || Array.isArray(val)) {
            return invalidValue('object', val);
        }
        var result: any = {};
        Object.getOwnPropertyNames(props).forEach((key) => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key)
                ? val[key]
                : undefined;
            result[prop.key] = transform(v, prop.typ, getProps);
        });
        Object.getOwnPropertyNames(val).forEach((key) => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps);
            }
        });
        return result;
    }

    if (typ === 'any') return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === 'object' && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === 'object') {
        return typ.hasOwnProperty('unionMembers')
            ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty('arrayItems')
            ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty('props')
            ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== 'number') return transformDate(typ, val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

// function m(additional: any) {
//   return { props: [], additional };
// }

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    Config: o(
        [
            { json: 'Targets', js: 'Targets', typ: r('Targets') },
            { json: 'Types', js: 'Types', typ: r('Types') },
            { json: 'Folders', js: 'Folders', typ: a(r('Folder')) },
        ],
        false
    ),
    Folder: o(
        [
            { json: 'FolderName', js: 'FolderName', typ: '' },
            { json: 'Src', js: 'Src', typ: '' },
            { json: 'Dest', js: 'Dest', typ: '' },
            { json: 'Types', js: 'Types', typ: a('') },
            { json: 'Exclude', js: 'Exclude', typ: a('') },
        ],
        false
    ),
    Targets: o(
        [
            { json: 'Dev', js: 'Dev', typ: r('Build') },
            { json: 'Build', js: 'Build', typ: r('Build') },
            { json: 'Ci', js: 'Ci', typ: r('Build') },
        ],
        false
    ),
    Build: o(
        [
            { json: 'Slug', js: 'Slug', typ: '' },
            { json: 'Path', js: 'Path', typ: '' },
        ],
        false
    ),
    Types: o(
        [
            { json: 'Styles', js: 'Styles', typ: r('Scripts') },
            { json: 'Scripts', js: 'Scripts', typ: r('Scripts') },
            { json: 'Static', js: 'Static', typ: a(r('Static')) },
        ],
        false
    ),
    Scripts: o(
        [
            { json: 'Sources', js: 'Sources', typ: a(r('Source')) },
            { json: 'Destination', js: 'Destination', typ: '' },
        ],
        false
    ),
    Source: o(
        [
            { json: 'Name', js: 'Name', typ: '' },
            { json: 'Src', js: 'Src', typ: '' },
            { json: 'Exclude', js: 'Exclude', typ: a('') },
        ],
        false
    ),
    Static: o(
        [
            { json: 'Name', js: 'Name', typ: '' },
            { json: 'Src', js: 'Src', typ: u(a(''), '') },
            { json: 'Dest', js: 'Dest', typ: '' },
            { json: 'Exclude', js: 'Exclude', typ: a('') },
        ],
        false
    ),
};
