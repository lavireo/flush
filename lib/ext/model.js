/*
 *
 * model.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 28-09-2016
 *
 * (c) Laviréo 2016
 */


const attribute    = require('./model-attr');
const modelQuery   = require('./model-query');
const stateMachine = require('../state-machine');
const bind         = require('../helpers').bind;
const mixin        = require('../helpers').mixin;

//
// Model class
module.exports = ((handle) =>
{
  //
  // Constructor
  function constr(opts)
  {
    this.__attr   = {};
    this.__states = {};
    this.__caches = {};
  };


  //
  // Methods
  mixin(constr.prototype, {
    /**
     * Get value by key.
     *
     * @param {string} key
     * @return {object|string|number}
     */
    get: function (key)
    {
      if (this.__attr[key])
        return this.__attr[key].value;

      throw new Error('Field not defined: ' + key);
    },


    /**
     * Set value by key.
     *
     * @param {string} key
     * @param {string|number|boolean} value
     * @return {object|string|number}
     *
     * @throws
     */
    set: function (key, value)
    {
      let attr;
      if (attr = this.__attr[key])
      {
        if (typeof value === attr.type)
        {
          //
          // Queue for update.
          // This will run after the request is processed.
          //
          // TODO (Maurice):
          // Implement!!!
          // Dunno how to get the request variable yet...
          // req.dirty_queue.push(this);

          attr.dirty = true;
          return value;
        }

        throw new Error('Data type not matching: ' + key);
      }

      throw new Error('Field not defined: ' + key);
    },


    /**
     * Saves the current state to the database.
     *
     * @return {boolean}
     */
    save: function ()
    {
      let id     = this.get('id');
      let query  = 'UPDATE {{table_name}} SET {{params}} WHERE id={{id}}';
      let params = [];

      //
      // Fill params array.
      for (let key in this.__attr)
      {
        let attr = this.__attr[key];
        if (attr.dirty)
          continue;

        params.push([key] + '=' + attr.value);
      }

      //
      // Join params
      params = params.join(', ');
    },

    /**
     * Destroy model.
     *
     * @return {boolean}
     */
    destroy: function ()
    {

    },


    /**
     * Checks if the current state is valid.
     *
     * @return {boolean}
     */
    validate: function ()
    {

    },


    /**
     * Define has_many relation.
     *
     * @param {string} model
     * @param {object} opts
     * @return {Model}
     */
    has: function (model, opts = {})
    {
      return this;
    },

    /**
     * Define belongs_to relation.
     *
     * @param {string} model
     * @param {object} opts
     * @return {Model}
     */
    belongs: function (model, opts = {})
    {
      return this;
    },


    /**
     *
     *
     * @param {string} col
     * @param {object} opts
     */
    createStateMachine: function (col, opts)
    {

    }
  });


  //
  // Static Methods
  mixin(constr, {
    /**
     * Query model.
     *
     * @return {ModelQuery}
     */
    query: function ()
    {
      return new modelQuery(handle.sql, this);
    },


    /**
     * Create model with params.
     *
     * @param {object} params
     * @return {object}
     */
    create: function (params)
    {
      //
      // Add default params.
      let opts = {
        created_at: Date.now() / 1000,
        updated_at: params['created_at']
      };

      //
      // Merge defaults with params.
      mixin(opts, params);


      //
      // TODO (Maurice):
      // Actually create the object in DB.
    }
  });

  return constr;
});
