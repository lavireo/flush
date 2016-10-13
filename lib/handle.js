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
const mysql  = require('mysql');
const redis  = require('redis');

const pool   = require('./pool');
const i18n   = require('./i18n');
const model  = require('./ext/model');
const mailer = require('./ext/mailer');
const worker = require('./ext/worker');
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

    //this.__initSQL();
    this.__initI18n();
    //this.__initRedis();
    this.__initBasis();
  };


  //
  // Methods
  mixin(constr.prototype, {
    sql:       null,
    i18n:      null,
    redis:     null,
    logger:    null,

    __app:     null,


    /**
     * Get a model with this method
     *
     * @param {string} key
     * @returns {function}
     *
     * @throws
     */
    getModel(key)
    {
      return this.__app.load('MODELS', key);
    },

    /**
     * Get a worker with this method
     *
     * @param {string} key
     * @returns {function}
     *
     * @throws
     */
    getWorker(key)
    {
      return this.__app.load('WORKERS', key);
    },

    /**
     * Get a mailer with this method
     *
     * @param {string} key
     * @returns {function}
     *
     * @throws
     */
    getMailer(key)
    {
      return this.__app.load('MAILERS', key);
    },

    /**
     * Get a setting with this method
     *
     * @param {string} key
     * @returns {number|string|object}
     *
     * @throws
     */
    getSetting(key)
    {
      let val = process.env[key];
      if (!!val)
      {
        return val;
      }

      throw new Error('Could not find setting: ' + key);
    },


    /**
     * This creates the initial database connection.
     */
    __initSQL: function ()
    {
      this.sql = new pool(
        //
        // Create
        () => {
          return mysql.createConnection({
            host:     this.getSetting('MYSQL_HOST'),
            user:     this.getSetting('MYSQL_USER'),
            password: this.getSetting('MYSQL_PASSWORD')
          });
        },
        //
        // Quit
        (conn) => {
          conn.end();
        });
    },

    /**
     * This initialises a new i18n handle.
     */
    __initI18n: function ()
    {
      this.i18n = new i18n(this.__locals);
    },

    /**
     * This initialises a new redis connection.
     */
    __initRedis: function ()
    {
      this.redis = new pool(
        //
        // Create
        () => {
          return redis.createClient({
            url:    this.getSetting('REDIS_HOST') + ':' + this.getSetting('REDIS_PORT'),
            prefix: this.getSetting('REDIS_PREFIX')
          });
        },
        //
        // Quit
        (conn) => {
          conn.quit();
        });
    },

    /**
     * Link all the base classes.
     */
    __initBasis: function ()
    {
      //
      // Utils
      this.utils  = {
        bind:     bind,
        mixin:    mixin,
        inherits: util.inherits
      };

      //
      // Stuff
      this.model  = model(this);
      this.worker = worker(this);
      this.mailer = mailer(this);
    }
  });

  return constr;
})();
