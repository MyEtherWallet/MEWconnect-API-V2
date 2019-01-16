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

/**
 * Get each lambda module's required npm packages, and install them in the
 * /dist directory of each individual module, so that it will work when uploaded to AWS.
 * This function is invoked at the bottom of this file.
 */
const run = async () => {
  let srcDirectories = await getDistDirectories()
  await asyncForEach(srcDirectories, async directory => {
    let imports = await getImports(directory)
    await writePackageJSON(directory, imports)
    await installPackages(directory)
  })
}

/**
 * Get and return an array of all of the /dist directories.
 * Each of these directories houses a separate lambda function module.
 * 
 * @return {Array} - Array of paths to each /dist lambda module directory
 */
const getDistDirectories = async () => {
  return new Promise((resolve, reject) => {
    let src = `${process.cwd()}/dist/lambda`
  	dir.files(src, 'dir',  (err, paths) => {
      resolve(paths)
    }, {
      recursive: false
    })
  })
}

/**
 * Given a lambda module @directory, find each npm module that is required/imported within
 * that lambda module's code.
 * 
 * @param  {String} directory - Path to the /dist lambda module
 * @return {Array} - Array of required/imported npm modules
 */
const getImports = async (directory) => {
  return new Promise((resolve, reject) => {
    let file = `${directory}/app.js`
    let src = fs.readFileSync(file, 'utf-8')
    let imports = findRequires(src)
    console.log(imports)
    resolve(imports)
  })
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
      let version = packageDependencies[imp] || null
      let resolution

      // Get resolution path of import //
      try {
        resolution = require.resolve(imp)
      } catch (e) {
        resolution = null
      }

      // If root package.json has a matching package, use that information/version //
      if(version) {
        dependencies[imp] = version
      }

      // If a resolution exists and it is a relative path (as opposed to a node_module), then copy the resolution... //
      // .. and add module-alias as a dependency //
      if(resolution && resolution.split('/').length > 1) {
        let relativePath = resolution.split('dist/')[1]
        moduleAliases[imp] = relativePath
        if (!isPrepended) {
          await addModuleAlias(`${directory}/app.js`)
          dependencies['module-alias'] = '^2.1.0'
          isPrepended = true
          fs.copySync(resolution, `${directory}/${relativePath}`)
        }
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
  const cmdAsync = promise.promisify(cmd.run, { multiArgs: true, context: cmd })
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