export { purify as default };
declare function purify(root: any): {
    (root: any): /*elided*/ any;
    version: string;
    removed: any[];
    isSupported: boolean;
    sanitize(dirty: any, ...args: any[]): any;
    setConfig(...args: any[]): void;
    clearConfig(): void;
    isValidAttribute(tag: any, attr: any, value: any): boolean;
    addHook(entryPoint: any, hookFunction: any): void;
    removeHook(entryPoint: any, hookFunction: any): any;
    removeHooks(entryPoint: any): void;
    removeAllHooks(): void;
};
declare namespace purify {
    let version: string;
    let removed: any[];
    let isSupported: boolean;
    function sanitize(dirty: any, ...args: any[]): any;
    function setConfig(...args: any[]): void;
    function clearConfig(): void;
    function isValidAttribute(tag: any, attr: any, value: any): boolean;
    function addHook(entryPoint: any, hookFunction: any): void;
    function removeHook(entryPoint: any, hookFunction: any): any;
    function removeHooks(entryPoint: any): void;
    function removeAllHooks(): void;
}
//# sourceMappingURL=dompurify.esm.d.ts.map