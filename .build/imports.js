'use strict'

require('module-alias/register')

const _ = require('lodash')
const cmd = require('node-cmd')
const dir = require('node-dir')
const findImports = require('find-imports')
const findRequires = require('find-requires')
const fs = require('fs-extra')
const readJson = require('read-package-json')
const writePkg = require('write-pkg')
const promise = require('bluebird')
const prependFile = require('prepend-file')

const SRC_DIR = `${process.cwd()}/dist/lambda`

/**
 * This module attempts to:
 * 1. Get the paths of each AWS lambda module.
 * 2. Recursively get each imported/required npm and local module
 * 3. Update each module's package.json with these dependencies
 * 4. Add module-alias npm module to each module
 * 5. Install the required npm packages locally in each AWS lambda module directory
 */
const run = async () => {
  let srcDirectories = await getDirectories(SRC_DIR)
  await asyncForEach(srcDirectories, async directory => {
    let file = `${directory}/app.js`
    let imports = await getImports(file)
    await writePackageJSON(directory, imports)
    await addModuleAlias(file)
    await installPackages(directory)
  })
}


/**
 * Get and return an array of all of the direct subdirectories within a @directory.
 * 
 * @return {Array} - Array of paths to each subdirectory
 */
const getDirectories = async (directory) => {
  return new Promise((resolve, reject) => {
  	dir.files(directory, 'dir', (err, paths) => {
      resolve(paths)
    }, {
      recursive: false
    })
  })
}

/**
 * Given a @file, recursively find each npm module that is required/imported within
 * that file's code and its dependencies.
 * 
 * @param  {String} file - Path to file
 * @return {Array} - Array of required/imported npm modules
 */
const getImports = async (file, imports = []) => {
  return new Promise(async (resolve, reject) => {
    let src = fs.readFileSync(file, 'utf-8')
    let _imports = findRequires(src)
    if(_imports.length > 0) {

      await asyncForEach(_imports, async _import => {
        let resolution = getImportResolution(_import)
        imports.push({
          import: _import,
          path: resolution
        })
        if(resolution && resolution.split('/').length > 1) await getImports(resolution, imports)
      })

    }
    resolve(imports)
  })
}

/**
 * Given an @_import, return the resolved path to that particular import, be it local or an npm module path.
 * @param  {String} _import - Name of module/import
 * @return {String} - Path of import or null
 */
const getImportResolution = (_import) => {
  let resolution
  try {
    resolution = require.resolve(_import)
  } catch (e) {
    resolution = null
  }
  return resolution
}



/**
 * Given a lambda module @directory and an array of its @imports,
 * generate and write/append-to a package.json file for that particular lambda module directory.
 * 
 * @param  {String} directory - Path to the /dist lambda module
 * @param  {Array} imports - Array of required/imported npm modules for the particular lambda module
 */
const writePackageJSON = async (directory, imports) => {
  return new Promise(async (resolve, reject) => {
    let dependencies = {}
    let packageDependencies = await getPackageDependencies()
    let moduleAliases = {}
    let isPrepended = false
    
    await asyncForEach(imports, async imp => {
      let _import = imp.import
      let resolution = imp.path
      let version = packageDependencies[_import] || null
 
      // If root package.json has a matching package, use that information/version //
      if(version) {
        dependencies[_import] = version
      }

      // Make module-alias dependency on all //
      dependencies['module-alias'] = '^2.1.0'

      // If a resolution exists and it is a relative path (as opposed to a node_module), then copy the resolution... //
      // ... into the AWS lambda module directory //
      if(resolution && resolution.split('/').length > 1) {
        let relativePath = resolution.split('dist/')[1]
        moduleAliases[_import] = relativePath
        fs.copySync(resolution, `${directory}/${relativePath}`)
      }
    })

    // Merge existing package.json in module directory with data obtained above //
    readJson(`${directory}/package.json`, async (err, data) => {
      let packageData = _.merge(data || {}, {dependencies: dependencies, _moduleAliases: moduleAliases})
      await writePkg(directory, packageData)
      resolve()
    })
  })
}

/**
 * Prepend a @file with require('module-alias/register')
 * @param  {String} file - File path
 */
const addModuleAlias = async (file) => {
  return new Promise(async (resolve, reject) => {
    prependFile(file, `require('module-alias/register');\n\n`, () => {
      resolve()
    })
  })
}

/**
 * Run npm install on a particular /dist lambda module.
 * 
 * @param  {String} directory - Path to the /dist lambda module
 */
const installPackages = async (directory) => {
  const cmdAsync = promise.promisify(cmd.get, { multiArgs: true, context: cmd })
  await cmdAsync(`npm install --prefix ${directory}`)
}

/**
 * Get detailed information for each installed/required npm module from the project root package.json
 * 
 * @return {Object} - Object with keys of each installed npm module (both dependencies and devDependencies),
 *                    and values of their versions. I.e. {"babel-cli": "^6.26.0"...}
 */
const getPackageDependencies = async () => {
  return new Promise((resolve, reject) => {
    readJson(`${process.cwd()}/package.json`, (err, data) => {
      let dependencies = data.dependencies || {}
      let devDependencies = data.devDependencies || {}
      let mergedDependencies = _.merge(dependencies, devDependencies)
      resolve(mergedDependencies)
    })
  })
}

/**
 * Polyfill for async-style forEach loop.
 * 
 * Example: 
 *
 * await asyncForEach(foo, async bar => {
 *   await baz(bar)
 * })
 * 
 * @param  {Array} array - Array to iterate through
 * @param  {Function} callback - Asynchronous function to perform
 */
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

run()