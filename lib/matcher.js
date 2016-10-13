/*
 *
 * matcher.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 28-09-2016
 *
 * (c) Laviréo 2016
 */


const bind    = require('./helpers').bind;
const mixin   = require('./helpers').mixin;

/**
 * Matcher class
 *
 * This is basically just a radix tree implementation with
 * added wildcard and variable matches.
 */
module.exports = (() =>
{
  //
  // Constructor
  function constr(opts)
  {
    this.__named  = {};
    this.__routes = [];
  };


  //
  // Methods
  mixin(constr.prototype, {
    /**
     * Add route.
     *
     * @param {string} path
     * @param {object} value
     * @return {string}
     */
    add: function (path, value)
    {
      let tnames  = path.match(/(\(\?)?:\w+/g);

      //
      // Load
      if (typeof value.act === 'function')
      {
        if (!!tnames)
          tnames.forEach(function(obj, it)
          {
            tnames[it] = obj.substring(1);
          });

        let tpath = this.__toRegex(path);
        this.__named[path] = value;
        this.__routes.push({
          name:   path,
          path:   tpath,
          params: tnames,
          acl:    value.acl,
          act:    value.act
        });
      }
    },


    /**
     * Match route.
     *
     * @param {string} path
     * @return {object}
     */
    find: function (path)
    {
      let i;
      let route;
      for (i in this.__routes)
      {
        route = this.__routes[i];
        if (route.path.test(path))
        {
          return {
            acl:     route.acl,
            act:     route.act,
            matches: this.__toParams(route, path)
          };
        }
      }

      return false;
    },


    /**
     * Remove trailing slash from the route
     *
     * @param {string} route
     * @return {string}
     */
     __path: function(route)
     {
       var path = route;
       return decodeURI(((path !== '/' && path.charAt(path.length - 1) === '/')
             ? path.slice(0, -1)
             : path)
       );
     },


     /**
      * Convert route to regex.
      *
      * @param {string} route
      * @return {string}
      */
     __toRegex: function(route)
     {
       route = route
         .replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&')
         .replace(/\((.*?)\)/g, '(?:$1)?')
         .replace(/(\(\?)?:\w+/g, function(match, optional)
       {
         return optional ? match : '([^/?]+)';
       }).replace(/\*\w+/g, '([^?]*?)');

       return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
     },

     /**
      * Convert route to params.
      *
      * @param {string} route
      * @param {string} current
      * @return {string}
      */
     __toParams: function(route, current)
     {
       var i      = 0;
       var raw    = route.path.exec(current).slice(1);
       var params = {};
       for (; i < raw.length; i++)
       {
         var param = raw[i] ? decodeURIComponent(raw[i]) : null;
         if (param)
         {
           if (!!route.params)
           {
             var name  = route.params[i];
             var value = param;
             params[name] = value;
           }
         }
       }

       return params;
     }
  });

  return constr;
})();
