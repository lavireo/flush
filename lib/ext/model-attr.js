/*
 *
 * model_attr.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 28-09-2016
 *
 * (c) Laviréo 2016
 */


const bind      = require('../helpers').bind;
const mixin     = require('../helpers').mixin;

//
// Model Attr class
module.exports = (() =>
{
  //
  // Constructor
  function constr(type, value)
  {
    this.type  = type;
    this.value = value || null;
    this.dirty = false;
  };

  return constr;
})();
