/**
 * VFileObject extends FileObject with virtual path support, maintaining both
 * a virtual path (relative to cap) and a real filesystem path.
 *
 * Virtual files must have a VDirectoryObject parent and cannot exist independently.
 * All file operations use the real filesystem path while exposing clean virtual paths.
 *
 * @property {string} supplied - User-supplied path
 * @property {string} path - The virtual file path (relative to cap)
 * @property {URL} url - The file URL
 * @property {string} name - The file name
 * @property {string} module - The file name without extension
 * @property {string} extension - The file extension
 * @property {boolean} isFile - Always true for files
 * @property {boolean} isVirtual - Always true for VFileObject instances
 * @property {VDirectoryObject} parent - The parent virtual directory object
 * @property {FileObject} real - The real filesystem FileObject
 * @property {Promise<boolean>} exists - Whether the file exists (async)
 */
export default class VFileObject extends FileObject {
    /**
     * Constructs a VFileObject instance.
     *
     * @param {string} fileName - The file path
     * @param {VDirectoryObject} parent - The parent virtual directory (required)
     */
    constructor(fileName: string, parent: VDirectoryObject);
    get isVirtual(): boolean;
    get real(): FileObject;
    #private;
}
import FileObject from "./FileObject.js";
//# sourceMappingURL=VFileObject.d.ts.map