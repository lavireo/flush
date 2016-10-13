/*
 *
 * inflector.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 29-09-2016
 *
 * (c) Laviréo 2016
 */


const bind  = require('./helpers').bind;
const mixin = require('./helpers').mixin;

//
// Logger class
module.exports = (() =>
{
  //
  // Constructor
  function constr(opts)
  {
  };


  //
  // Methods
  mixin(constr.prototype, {
    /**
     * Object holding the word cache.
     *
     * @const
     * @private
     * @type {object}
     */
    __cache: {},


    /**
     * Get plural/singular version of the word.
     *
     * @param {string} word
     * @param {object} rules
     * @returns {string}
     *
     * TODO (Maurice):
     * Make this fully case insensitive.
     */
    exec: function (word, rules, type)
    {
      if (!word.length)
      {
        return word;
      }

      //
      // Return word from cache
      if (this.__cache[word]
       && this.__cache[word][type])
      {
        return this.__cache[word][type];
      }


      //
      // Check if the word is uncountable.
      if (-1 < rules.uncountable.indexOf(word))
      {
        if (!this.__cache[word])
          this.__cache[word] = {};

        //
        // Add cache for plural and singular
        this.__cache[word]['plural']   =
        this.__cache[word]['singular'] = word;

        return word;
      }

      //
      // Iterator over rules and use the first that matches.
      let len = rules[type].length;
      let rule;
      while (len--)
      {
        rule = rules[type][len];
        regA = RegExp(rule[0], 'i');
        regB = rule[1];

        //
        // If the rule passes, return the replacement.
        if (regA.test(word))
        {
          return word.replace(regA, regB);
        }
      }
    }
  });

  return constr;
})();
