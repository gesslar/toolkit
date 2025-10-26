/**
 * File system utility class for path operations and file discovery.
 */
export default class FS {
    static fdTypes: readonly string[];
    static upperFdTypes: readonly string[];
    static fdType: any;
    /**
     * Fix slashes in a path
     *
     * @param {string} pathName - The path to fix
     * @returns {string} The fixed path
     */
    static fixSlashes(pathName: string): string;
    /**
     * Convert a path to a URI
     *
     * @param {string} pathName - The path to convert
     * @returns {string} The URI
     */
    static pathToUri(pathName: string): string;
    /**
     * Convert a URI to a path
     *
     * @param {string} pathName - The URI to convert
     * @returns {string} The path
     */
    static uriToPath(pathName: string): string;
    /**
     * Retrieve all files matching a specific glob pattern.
     *
     * @param {string|Array<string>} glob - The glob pattern(s) to search.
     * @returns {Promise<Array<FileObject>>} A promise that resolves to an array of file objects
     * @throws {Sass} If the input is not a string or array of strings.
     * @throws {Sass} If the glob pattern array is empty or for other search failures.
     */
    static getFiles(glob: string | Array<string>): Promise<Array<FileObject>>;
    /**
     * Computes the relative path from one file or directory to another.
     *
     * If the target is outside the source (i.e., the relative path starts with ".."),
     * returns the absolute path to the target instead.
     *
     * @param {FileObject|DirectoryObject} from - The source file or directory object
     * @param {FileObject|DirectoryObject} to - The target file or directory object
     * @returns {string} The relative path from `from` to `to`, or the absolute path if not reachable
     */
    static relativeOrAbsolutePath(from: FileObject | DirectoryObject, to: FileObject | DirectoryObject): string;
    /**
     * Merge two paths by finding overlapping segments and combining them efficiently
     *
     * @param {string} path1 - The first path
     * @param {string} path2 - The second path to merge with the first
     * @param {string} [sep] - The path separator to use (defaults to system separator)
     * @returns {string} The merged path
     */
    static mergeOverlappingPaths(path1: string, path2: string, sep?: string): string;
    /**
     * Resolve a path relative to another path using various strategies
     * Handles absolute paths, relative navigation, and overlap-based merging
     *
     * @param {string} fromPath - The base path to resolve from
     * @param {string} toPath - The target path to resolve
     * @returns {string} The resolved path
     */
    static resolvePath(fromPath: string, toPath: string): string;
}
import FileObject from "./FileObject.js";
import DirectoryObject from "./DirectoryObject.js";
//# sourceMappingURL=FS.d.ts.map