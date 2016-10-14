/*
 *
 * logger.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 29-09-2016
 *
 * (c) Laviréo 2016
 */


const fs      = require('fs');
const path    = require('path');

const bind    = require('./helpers').bind;
const mixin   = require('./helpers').mixin;

//
// Logger class
module.exports = (() =>
{
  //
  // Constructor
  function constr()
  {
  };


  //
  // Methods
  mixin(constr.prototype, {
    colors: {
      GREEN:   new Buffer([27, 91, 57, 55, 59, 52, 50, 109]).toString(),
      WHITE:   new Buffer([27, 91, 57, 55, 59, 52, 55, 109]).toString(),
      YELLOW:  new Buffer([27, 91, 57, 55, 59, 52, 51, 109]).toString(),
      RED:     new Buffer([27, 91, 57, 55, 59, 52, 49, 109]).toString(),
      BLUR:    new Buffer([27, 91, 57, 55, 59, 52, 52, 109]).toString(),
      MAGENTA: new Buffer([27, 91, 57, 55, 59, 52, 53, 109]).toString(),
      CYAN:    new Buffer([27, 91, 57, 55, 59, 52, 54, 109]).toString(),
      RESET:   new Buffer([27, 91, 48, 109]).toString()
    },


    /**
     * Get color from code.
     *
     * @param {number} status
     * @returns {string}
     */
    colorForStatus: function (status)
    {
    	if (status >= 200 && status < 300)
    		return this.colors.GREEN;
    	else if (status >= 300 && status < 400)
    		return this.colors.WHITE;
    	else if (status >= 400 && status < 500)
    		return this.colors.YELLOW;
    	else
    		return this.colors.RED;
    },

    /**
     * Get color from code.
     *
     * @param {string} method
     * @returns {string}
     */
    colorForMethod: function (method)
    {
      switch (method)
      {
      case 'GET':
      	return this.colors.BLUE;

      case 'POST':
      	return this.colors.CYAN;

      case 'PUT':
      	return this.colors.YELLOW;

      case 'DELETE':
      	return this.colors.RED;

      case 'PATCH':
      	return this.colors.GREEN;

      case 'HEAD':
      	return this.colors.MAGENTA;

      case 'OPTIONS':
      	return this.colors.WHITE;

      default:
      	return this.colors.RESET;
      }
    }
  });

  return constr;
})();
