/*
 *
 * flush.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 28-09-2016
 *
 * (c) Laviréo 2016
 */


const fs            = require('fs-plus');
const qs            = require('qs');
const url           = require('url');
const ejs           = require('ejs');
const path          = require('path');
const cors          = require('cors');
const util          = require('util');
const mime          = require('mime');
const mkdirp        = require('mkdirp');
const emitter       = require('events').EventEmitter;
const accepts       = require('accepts');
const cookies       = require('cookies');
const promise       = require('promise');
const connect       = require('connect');
const strftime      = require('strftime');
const jsonParser    = require('body-parser').json;
const encodedParser = require('body-parser').urlencoded;
const cookieParser  = require('cookie-parser');

const handle        = require('./handle');
const loader        = require('./loader');
const logger        = require('./logger');
const matcher       = require('./matcher');
const bind          = require('./helpers').bind;
const mixin         = require('./helpers').mixin;

//
// Server class
module.exports = (() =>
{
  /**
   * Constructor
   *
   * @param {string} base
   */
  function constr (base)
  {
    emitter.call(this);

    //
    // Setup other stuff
    this.__app      = connect();
    this.__base     = base;
    this.__loader   = new loader(this, path.join(base, 'app'), this.__paths);

    this.__loadRoutes();
    this.__loadLocals();

    this.__logger = new logger();
    this.__handle = new handle(this, this.__locals, this.__logger);

    //
    // Register all middelware
    this.__app.use(cors());
    this.__app.use(cookieParser());
    this.__app.use(bind(this.__middlewareQueue,         this.__handle));
    this.__app.use(bind(this.__middlewareLogger,        this.__handle));
    this.__app.use(bind(this.__middlewareServer,        this.__handle));
    this.__app.use(bind(this.__middlewareParserJson,    this.__handle));
    this.__app.use(bind(this.__middlewareParserEncoded, this.__handle));
    this.__app.use(bind(this.__middlewareRequest,       this.__handle));
    this.__app.use(bind(this.__middlewareResponse,      this.__handle));
    this.__app.use(bind(this.__middlewareOutput,        this.__handle));

    this.__loadMixins();
    this.__loadMiddleware();

    //
    // Add routing middleware AND LISTEN!!!
    this.__app.use(bind(this.__middlewareRoute, this));
    this.__app.listen(process.env.MCR_PORT || 3000);
  };


  //
  // Extend Emitter
  util.inherits(constr, emitter);


  //
  // Methods
  mixin(constr.prototype, {
    __paths:       {
      MIXINS:      'mixins',
      MODELS:      'models',
      ROUTES:      'routes',
      WORKERS:     'workers',
      MAILERS:     'mailers',
      MIDDLEWARE:  'middleware',
    },

    __matchers:    {
      GET:         new matcher(),
      PUT:         new matcher(),
      POST:        new matcher(),
      PATCH:       new matcher(),
      DELETE:      new matcher()
    },

    __cache:       {},
    __locals:      {},
    __settings:    {},

    __app:         null,
    __base:        null,
    __handle:      null,
    __logger:      null,
    __loader:      null,


    /**
     * Get Model constr.
     *
     * @param {string} type
     * @param {string} key
     * @returns {function}
     *
     * @throws
     */
    load: function (type, key)
    {
      let path;
      let model;
      if (path = this.__paths[type])
      {
        model = this.__loader.load(path, key);
        return model(this.__handle);
      }

      throw new Error("Uknown type: " + type);
    },


    /**
     * Setup Route middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareRoute: function (req, res, nxt)
    {
      let  url     = req.url.replace(/[?#].*$/, '');
      let  matcher = this.__matchers[req.method === 'HEAD' ? 'GET' : req.method];
      if (!matcher)
      {
        return nxt(new Error('Unknown request method: ' + req.method));
      }

      let  target = matcher.find(url);
      if (!target)
      {
        //
        // Move onto the 404.
        nxt();
      }

      req.params = req.params || {};
      if (target)
      {
        //
        // Process params
        if (target.matches)
        {
          for (var key in target.matches)
          {
            req.params[key] = decodeURI(target.matches[key]);
          }
        }

        //
        // Process action
        target.act.call(this.__handle, req, res);
      }

      nxt();
    },

    /**
     * Setup Queue middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareQueue: function (req, res, nxt)
    {
      req.dirty_queue = [];

      //
      // Call chain
      nxt();

      //
      // Update models
    },

    /**
     * Setup Logger middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareLogger: function (req, res, nxt)
    {
      let log;
      let timeA;
      let timeB;
      let methodColor;
      let statusColor;


      timeA = Date.now();

      //
      // Process request
      nxt();

      timeB       = Date.now();
      resetColor  = this.__logger.colors.RESET;
      methodColor = this.__logger.colorForStatus(req.method);
      statusColor = this.__logger.colorForStatus(res.statusCode);

      //
      // Writes a log in format of:
      // YYYY/MM/DD - HH:MM:SS GET [200] 255.255.255.255 /path | latency
      log = util.format('%s %s %s %s [%s %d %s] %s %s %dms', strftime('%Y/%m/%d - %H:%M:%S', new Date(timeB)), methodColor, req.method, resetColor, statusColor, res.statusCode, resetColor, req.connection.remoteAddress, req.originalUrl, timeB - timeA);
      if (process.env.NODE_ENV)
      {
        console.log(log);
      }
    },

    /**
     * Setup Output middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareOutput: function (req, res, nxt)
    {
      /**
       *
       *
       * @param {string} body
       */
      res.send = (status, body) =>
      {
        //
        // Set status code
        if (status)
        {
          res.statusCode = status;
        }

        //
        // Strip some headers
        if (204 === res.statusCode || 304 === res.statusCode)
        {
          res.removeHeader('Content-Type');
          res.removeHeader('Content-Length');
          res.removeHeader('Transfer-Encoding');
          body = '';
        }

        //
        // Send it!
        (req.method === 'HEAD')
        ? res.end()
        : res.end(body, 'utf8');

        return res;
      };

      /**
       * Register view helper
       *
       * @param {number} status
       * @param {string} view
       */
      res.view = (status, view) =>
      {
        //
        // TODO (Maurice):
        // Implement this.
        throw new Error('Tell Maurice to implement this!');
        return res.send(status, body);
      };

      /**
       * Register json helper
       *
       * @param {number} status
       * @param {object} data
       */
      res.json = (status, data) =>
      {
        let body = JSON.stringify(data);

        //
        // Content-Type
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json');
        }

        return res.send(status, body);
      };

      /**
       * Register format helper
       *
       * @param {object} formats
       */
      res.format = (formats) =>
      {
        let accept = accepts(req);
        let format = accept.types.apply(accept, formats);

        //
        // Send to action
        if (format)
        {
          res.setHeader('Content-Type', mime.lookup(format));
          formats[format](req, res, nxt);
        }
        //
        // Fail
        else
        {
          //
          // TODO (Maurice):
          // Make a better error thingy.
          nxt(new Error('Could not handle this format'));
        }

        return res;
      }

      nxt();
    },

    /**
     * Setup Server middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareServer: function (req, res, nxt)
    {
      res.setHeader('Server', 'Flush');
      nxt();
    },

    /**
     * Setup Parser middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareParserJson: function (req, res, nxt)
    {
      //
      // Skip parser if:
      //
      // - Method is GET/HEAD
      // - Content-Type matches multipart
      if (req.busboy
       || req.method === 'GET'
       || req.method === 'HEAD'
       || req.headers['content-type']
       && req.headers['content-type'].match(/multipart/))
      {
        return nxt();
      }

      //
      // Parser config
      //
      // NOTE (Maurice):
      // I should set some limits here.
      // Those limits should be set by the subscription we'll add later.
      let conf = {
        //limit:
      }

      let parser = jsonParser(conf);


      //
      // Parse and return
      return parser(req, res, nxt);
    },

    /**
     * Setup Parser middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareParserEncoded: function (req, res, nxt)
    {
      //
      // Skip parser if:
      //
      // - Method is GET/HEAD
      // - Content-Type matches multipart
      if (req.busboy
       || req.method === 'GET'
       || req.method === 'HEAD'
       || req.headers['content-type']
       && req.headers['content-type'].match(/multipart/))
      {
        return nxt();
      }

      //
      // Parser config
      //
      // NOTE (Maurice):
      // I should set some limits here.
      // Those limits should be set by the subscription we'll add later.
      let conf = {
        extended: false
      }

      let parser = encodedParser(conf);

      //
      // Parse and return
      return parser(req, res, nxt);
    },

    /**
     * Setup Request middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareRequest: function (req, res, nxt)
    {
      let params = qs.parse(url.parse(req.url).query);
      req.params = mixin(params, req.body);
      nxt();
    },

    /**
     * Setup Response middleware.
     *
     * @param {object} req
     * @param {object} res
     * @param {function} nxt
     */
    __middlewareResponse: function (req, res, nxt)
    {
      //
      // Cookie Jar
      let jar = new cookies(req, res);

      /**
       * Redirect to location.
       *
       * @param {string} url
       */
      res.redirect = (url) =>
      {
        res.writeHead(301, { 'Location': url });
        res.end();
      };

      /**
       * Set cookie.
       *
       * @param {string} name
       * @param {string} value
       * @param {object} opts
       */
      res.cookie = (name, value, opts) =>
      {
        opts = opts || {};
        jar.set(name, value, opts);
      }

      /**
       * Delete cookie.
       *
       * @param {string} name
       * @param {object} opts
       */
      res.deleteCookie = (name, opts) =>
      {
        opts.maxAge = -3600;
        jar.set(name, '', opts);
      };

      nxt();
    },


    /**
     * Load all routes.
     */
    __loadRoutes: function ()
    {
      let r_i      = 0;
      let r_data   = this.__loader.readDir(path.join(this.__base, 'app', 'routes'));
      let r_length = r_data.length;
      for (; r_i < r_length; r_i++)
      {
        let paths = this.__loader.load(this.__paths.ROUTES, r_data[r_i]
                                 .replace(/\.[^.]*$/, ''));

        //
        // For paths
        for (let path in paths)
        {
          //
          // For methods
          for (let method in paths[path])
          {
            let route = paths[path][method];
            if (!this.__matchers[method])
            {
              throw new Error('Unknown request method '+ method +' for '+ path);
            }

            this.__matchers[method].add(path, route);
          }
        }
      }
    },

    /**
     * Load all locals.
     */
    __loadLocals: function ()
    {
      let l_i      = 0;
      let l_dir    = path.join(this.__base, 'locals');
      let l_data   = this.__loader.readDir(l_dir);
      let l_length = l_data.length;
      for (; l_i < l_length; l_i++)
      {
        let file = l_data[l_i];
        let name = l_data[l_i].replace(/\.[^.]*$/, '');
        try {
          let raw   = fs.readFileSync(l_dir + '/' + file, 'utf-8');
          let local = JSON.parse(raw);
          this.__locals[name] = local;
        }
        catch (e)
        {
          console.error('Error loading locale:', name, e.stack);
          throw e;
        }
      }
    },

    /**
     * Load mixins.
     */
    __loadMixins: function ()
    {
      let m_i      = 0;
      let m_data   = this.__loader.readDir(path.join(this.__base, 'app', 'mixins'));
      let m_length = m_data.length;
      for (; m_i < m_length; m_i++)
      {
        let mixin = this.__loader.load(this.__paths.MIXINS, m_data[m_i].replace(/\.[^.]*$/, ''));

        if (typeof mixin.act !== 'function')
        {
          throw new Error('mixin.act must be a function');
        }

        //
        // Bind the event
        this.on(mixin.ev, bind(mixin.act, this.__handle));
      }
    },

    /**
     * Load middleware.
     */
    __loadMiddleware: function ()
    {
      let m_i      = 0;
      let m_data   = this.__loader.readDir(path.join(this.__base, 'app', 'middleware'));
      let m_length = m_data.length;

      for (; m_i < m_length; m_i++)
      {
        let middleware = this.__loader.load(this.__paths.MIDDLEWARE, m_data[m_i].replace(/\.[^.]*$/, ''));

        if (typeof middleware !== 'function')
        {
          throw new Error('Middleware must be a function');
        }

        //
        // Activate it!
        this.__app.use(bind(middleware, this.__handle));
      }
    }
  });

  return constr;
})();
