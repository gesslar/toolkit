/**
 * @file VDirectoryObject.js
 * @description Abstract base class for directory objects that are constrained
 * to a specific directory tree (the "cap"). This provides security by ensuring
 * all operations remain within the capped directory hierarchy.
 *
 * This class is not intended to be instantiated directly. Use subclasses like
 * TempDirectoryObject that define specific caps.
 */

import path from "node:path"

import Sass from "./Sass.js"
import DirectoryObject from "./DirectoryObject.js"

export default class VDirectoryObject extends DirectoryObject {

}
