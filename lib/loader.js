/*
 *
 * loader.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 28-09-2016
 *
 * (c) Laviréo 2016
 */


const p     = require('path');
const fs    = require('fs-plus');

const bind  = require('./helpers').bind;
const mixin = require('./helpers').mixin;

//
// Loader class
module.exports = (() =>
{
  //
  // Constructor
  function constr(app, dir, paths)
  {
    this.__app   = app;
    this.__dir   = dir;
    this.__paths = paths;

    //
    // Create object cache.
    for (let key in this.__paths)
    {
      this.__caches.FILE[this.__paths[key]] = {};
    }

    //
    // Precompile all templates.
    for (let key in this.__paths)
    {
      let path      = this.__paths[key];
      let directory = dir + '/' + path;

      //
      // Skip if it's a file.
      if (!this.isDir(directory))
        continue;

      fs.readdirSync(directory).forEach((file) => {
        //
        // Skip if directory.
        if (this.isDir(directory + '/' + file)) return;

        //
        // Skip hidden files.
        if (file.charAt(0) == '.') return;

        if (file.substr(file.length - 3) === '.js')
        {
          file = file.substr(0, file.length - 3);
        }

        this.load(path, file);
      });
    }
  };


  //
  // Methods
  mixin(constr.prototype, {
    __app:    null,
    __dir:    null,
    __caches: {
      PATH:   {},
      FILE:   {},
      LIST:   {}
    },


    /**
     * Load objects from files.
     *
     * @param {string} type
     * @param {string} name
     * @param {string} dir
     * @param {boolean} clean
     * @returns {object}
     */
    load: function (type, name, clean = false)
    {
      //
      // Get file from cache
      if (this.__caches.FILE[type][name] && !clean)
      {
        return this.__caches.FILE[type][name];
      }

      //
      // Load fresh file.
      let path  = name.replace(/\./g, '/');
      let file  = this.__dir + '/' + type + '/' + path + '.js';
      let found = false;

      if (this.exists(file))
      {
        try {
          this.__caches.FILE[type][name] = require(file);
          found = true;
        }
        catch (e)
        {
          console.error('Error loading file:', type, name, e.stack);
          throw e;
        }
      }

      if (!found)
      {
        throw new Error('Unable to find ' + type + '/' + path);
      }

      return this.__caches.FILE[type][name];
    },


    /**
     * Check if file exists.
     *
     * @param {string} path
     * @returns {boolean}
     */
    exists: function (path)
    {
      let dir  = p.dirname(path);
      let base = p.basename(path);

      return this.readDir(dir).indexOf(base) !== -1;
    },


    /**
     * Look if path is a directory.
     *
     * @param {string} path
     * @returns {bool}
     */
    isDir: function (path)
    {
      try
      {
        return fs.statSync(path).isDirectory();
      }
      //
      // Not found...
      catch (e)
      {
        return false;
      }
    },

    /**
     * Read directory content into array.
     *
     * @param {string} path
     * @returns {array}
     */
    readDir: function (path)
    {
      if (!this.__caches.LIST[path])
      {
        this.__caches.LIST[path] = fs.existsSync(path) ? fs.readdirSync(path) : [];
      }

      return this.__caches.LIST[path];
    }
  });

  return constr;
})();
