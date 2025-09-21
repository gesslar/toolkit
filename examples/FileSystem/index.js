/**
 * Example: FileSystem utilities usage in JavaScript
 * Author: gesslar
 * Date: 2025-09-21
 *
 * Demonstrates file system operations using FileObject and DirectoryObject
 * from the @gesslar/toolkit package.
 */
import {FileObject, DirectoryObject, File, Data, Term, Sass} from "../../src/index.js"

!(async() => {
  Term.info("=== @gesslar/toolkit FileSystem Example ===")

  // Create some file and directory objects
  const currentDir = new DirectoryObject(".")
  const packageFile = new FileObject("package.json")
  const srcDir = new DirectoryObject("src")
  const readmeFile = new FileObject("README.md")

  Term.info("\n--- Object Information ---")
  Term.info("Current directory:", currentDir.toJSON())
  Term.info("Package file:", packageFile.toJSON())
  Term.info("Source directory:", srcDir.toJSON())

  // Check if files and directories exist
  Term.info("\n--- Existence Checks ---")
  Term.info("Current directory exists:", await currentDir.exists)
  Term.info("Package.json exists:", await packageFile.exists)
  Term.info("Source directory exists:", await srcDir.exists)
  Term.info("README.md exists:", await readmeFile.exists)

  // Demonstrate file operations
  if(await packageFile.exists) {
    Term.info("\n--- Package.json Analysis ---")
    Term.info("File size:", await File.fileSize(packageFile), "bytes")
    Term.info("Last modified:", await File.fileModified(packageFile))
    Term.info("Can read:", await File.canReadFile(packageFile))
    Term.info("Can write:", await File.canWriteFile(packageFile))

    try {
      const packageData = await File.loadDataFile(packageFile)
      Term.info("Package name:", packageData.name)
      Term.info("Package version:", packageData.version)
      Term.info("Package description:", packageData.description)
    } catch(error) {
      Term.warn("Could not load package data:", error.message)
    }
  }

  // Demonstrate directory listing
  if(await currentDir.exists) {
    Term.info("\n--- Directory Listing ---")
    try {
      const {files, directories} = await File.ls(currentDir.path)
      Term.info(`Found ${files.length} files and ${directories.length} directories`)
      
      Term.info("Files:")
      files.slice(0, 5).forEach(file => {
        Term.info(`  - ${file.name} (${file.extension || 'no extension'})`)
      })
      
      if(files.length > 5) {
        Term.info(`  ... and ${files.length - 5} more files`)
      }

      Term.info("Directories:")
      directories.slice(0, 5).forEach(dir => {
        Term.info(`  - ${dir.name}/`)
      })

      if(directories.length > 5) {
        Term.info(`  ... and ${directories.length - 5} more directories`)
      }
    } catch(error) {
      Term.warn("Could not list directory:", error.message)
    }
  }

  // Demonstrate file globbing
  Term.info("\n--- File Globbing ---")
  try {
    const jsFiles = await File.getFiles("**/*.js")
    Term.info(`Found ${jsFiles.length} JavaScript files`)
    
    jsFiles.slice(0, 3).forEach(file => {
      Term.info(`  - ${file.path}`)
    })
    
    if(jsFiles.length > 3) {
      Term.info(`  ... and ${jsFiles.length - 3} more`)
    }
  } catch(error) {
    Term.warn("Could not glob files:", error.message)
  }

  // Demonstrate Data utility functions
  Term.info("\n--- Data Utilities Demo ---")
  const testArray = ["hello", "world", "hello", "toolkit"]
  const testObject = {name: "toolkit", version: "1.0.0", tags: ["utility", "file", "data"]}
  
  Term.info("Original array:", testArray)
  Term.info("Unique array:", Data.isArrayUnique(testArray))
  Term.info("All strings?", Data.uniformStringArray(testArray))
  Term.info("Object empty?", Data.isObjectEmpty(testObject))
  Term.info("Array empty?", Data.isEmpty([]))
  Term.info("String empty?", Data.isEmpty(""))
  Term.info("String type?", Data.isType("hello", "string"))
  Term.info("Array type?", Data.isType(testArray, "array"))

  // Demonstrate path operations
  Term.info("\n--- Path Operations ---")
  const homeFile = new FileObject("~/test.txt")
  const projectFile = new FileObject("./src/index.js")
  
  Term.info("Home file path:", homeFile.path)
  Term.info("Project file path:", projectFile.path)
  Term.info("File name:", projectFile.name)
  Term.info("File module:", projectFile.module)
  Term.info("File extension:", projectFile.extension)
  Term.info("File directory:", projectFile.directory.path)

  // Demonstrate Sass error handling
  Term.info("\n--- Sass Error Handling Demo ---")
  try {
    try {
      throw Sass.new("This is a test error")
    } catch(firstError) {
      Term.info("Caught first error, rethrowing with additional context...")
      throw Sass.new("Error occurred while testing", firstError)
    }
  } catch(finalError) {
    Term.info("\nError caught! Reporting in normal mode:")
    finalError.report(false)
    
    Term.info("\nSame error in nerd mode:")
    finalError.report(true)
  }

  Term.info("\n=== Example completed successfully! ===")
})()