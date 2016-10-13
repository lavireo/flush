/*
 *
 * i18n.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 06-10-2016
 *
 * (c) Laviréo 2016
 */


const ejs       = require('ejs');

const inflector = require('./inflector');
const bind      = require('./helpers').bind;
const mixin     = require('./helpers').mixin;

//
// I18n class
module.exports = (() =>
{
  //
  // Constructor
  function constr(locals)
  {
    for (let loc in locals)
    {
      this.__data[loc]   = locals[loc];
      this.__cache[loc]  = {};
    }

    this.__inflector = new inflector();
  };


  //
  // Methods
  mixin(constr.prototype, {
    __data:      {},
    __cache:     {},

    __inflector: null,


    /**
     * Get localisation from path
     *
     * @param {string} loc
     * @param {string} path
     * @param {object} data
     * @return {string|object}
     */
    t: function (path, data, local)
    {
      //
      // Data not set but local is.
      if (typeof data === 'string')
      {
        local = data;
        data  = null;
      }

      //
      // Create cache
      if (!this.__caches[local][path])
      {
        let i     = 0;
        let cur   = this.__data[local];
        let parts = path.split('.');

        for (; i < parts.length; i++)
        {
          cur = cur[parts[i]] || null;
        }

        this.__caches[local][path] = cur.indexOf('<%') > -1
                                   ? ejs.compile(cur)
                                   : cur;
      }

      //
      // Get from cache
      let loc = this.__caches[local][path];

      //
      // Parse localisation
      if (loc && data && typeof loc === 'function')
      {
        loc = ejs.render(data);
      }

      //
      // Don't throw an error just because the string is missing.
      return loc || path;
    },


    /**
     * Get plural from word.
     *
     * @param {string} word
     * @param {string} local
     * @return {string}
     */
    pluralize: function (word, local = 'en')
    {
      let data  = this.__data[local];
      let rules = data.rules;

      //
      // Return word if rules aren't defined for given local.
      return rules
           ? this.__inflector.exec(word, rules, 'plural')
           : word;
    },

    /**
     * Get singular from word.
     *
     * @param {string} word
     * @param {string} local
     * @return {string}
     */
    singularize: function (word, local = 'en')
    {
      let data  = this.__data[local];
      let rules = data.rules;

      //
      // Return word if rules aren't defined for given local.
      return rules
           ? this.__inflector.exec(word, rules, 'singular')
           : word;
    },
  });


  //
  // Static Methods
  mixin(constr, {
  });

  return constr;
})();
