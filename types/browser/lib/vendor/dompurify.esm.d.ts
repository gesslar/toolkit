/*! @license DOMPurify 3.3.0 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.0/LICENSE */
declare var purify: {
    (root: any): /*elided*/ any;
    version: string;
    removed: any[];
    isSupported: boolean;
    sanitize: (dirty: any) => any;
    setConfig: () => void;
    clearConfig: () => void;
    isValidAttribute: (tag: any, attr: any, value: any) => boolean;
    addHook: (entryPoint: any, hookFunction: any) => void;
    removeHook: (entryPoint: any, hookFunction: any) => any;
    removeHooks: (entryPoint: any) => void;
    removeAllHooks: () => void;
};
export { purify as default };
//# sourceMappingURL=dompurify.esm.d.ts.map