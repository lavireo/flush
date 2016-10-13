/*
 *
 * model-query-node.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 10-10-2016
 *
 * (c) Laviréo 2016
 */


const bind      = require('../helpers').bind;
const mixin     = require('../helpers').mixin;

//
// Model Query Node class
module.exports = (() =>
{
  //
  // Constructor
  function constr(type, values)
  {
    this.type   = type;
    this.values = values || [];
  };

  return constr;
})();
