/*
 *
 * handle.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 05-10-2016
 *
 * (c) Laviréo 2016
 */


const util   = require('util');

const i18n   = require('./i18n');
const bind   = require('./helpers').bind;
const mixin  = require('./helpers').mixin;

//
// Handle class
//
// This classes purpose is to house all of the following things:
//
// - Models
// - Workers
// - Mailers
// - Settings
// - Localisation
module.exports = (() =>
{
  /*
   * Constructor
   *
   * @param {object} app
   * @param {object} locals
   * @param {object} logger
   */
  function constr(app, locals, logger)
  {
    this.__app    = app;
    this.__locals = locals;
    this.__logger = logger;

    this.__initI18n();
  };


  //
  // Methods
  mixin(constr.prototype, {
    i18n:   null,
    config: null,
    logger: null,

    __app:  null,


    /**
     * load a file with this method.
     * Type defined a subpath in the app directory.
     *
     * @param {string} type
     * @param {string} key
     * @returns {function}
     *
     * @throws
     */
    load: function (type, path)
    {
      return this.__app.load(type, path);
    },


    /**
     * This initialises a new i18n handle.
     */
    __initI18n: function ()
    {
      this.i18n = new i18n(this.__locals);
    }
  });

  return constr;
})();
