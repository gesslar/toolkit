import Data from "./Data.js"
import Valid from "./Valid.js"

export default class Collection {
  static evalArray(collection, predicate, forward=true) {
    const req = "Array"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = forward
      ? Array.from(collection)
      : Array.from(collection).toReversed()

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i], i, collection) ?? null

      if(result)
        return result
    }
  }

  static evalObject(collection, predicate) {
    const req = "Object"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = Object.entries(collection)

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i][1], work[i][0], collection)

      if(result)
        return result
    }
  }

  static evalSet(collection, predicate) {
    const req = "Set"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = Array.from(collection)

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i], collection)

      if(result)
        return result
    }
  }

  static evalMap(collection, predicate, forward=true) {
    const req = "Map"
    const type = Data.typeOf(collection)

    Valid.type(collection, req, `Invalid collection. Expected '${req}, got ${type}`)
    Valid.type(predicate, "Function",
      `Invalid predicate, expected 'Function', got ${Data.typeOf(predicate)}`)

    const work = forward
      ? Array.from(collection)
      : Array.from(collection).toReversed()

    for(let i = 0; i < work.length; i++) {
      const result = predicate(work[i][1], work[i][0], collection) ?? null

      if(result)
        return result
    }
  }

  static zip(array1, array2) {
    const minLength = Math.min(array1.length, array2.length)

    return Array.from({length: minLength}, (_, i) => [array1[i], array2[i]])
  }

  static unzip(array) {
    if(!Array.isArray(array) || array.length === 0) {
      return [] // Handle empty or invalid input
    }

    // Determine the number of "unzipped" arrays needed
    // This assumes all inner arrays have the same length, or we take the max length
    const numUnzippedArrays = Math.max(...array.map(arr => arr.length))

    // Initialize an array of empty arrays to hold the unzipped results
    const unzipped = Array.from({length: numUnzippedArrays}, () => [])

    // Iterate through the zipped array and populate the unzipped arrays
    for(let i = 0; i < array.length; i++) {
      for(let j = 0; j < numUnzippedArrays; j++) {
        unzipped[j].push(array[i][j])
      }
    }

    return unzipped
  }
}
