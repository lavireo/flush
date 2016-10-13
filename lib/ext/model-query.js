/*
 *
 * model_query.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 10-10-2016
 *
 * (c) Laviréo 2016
 */


const promise   = require('promise');

const queryNode = require('./model-query-node');
const bind      = require('../helpers').bind;
const mixin     = require('../helpers').mixin;
const keywords  = {
  OR:        'OR',
  NOT:       'NOT',
  ALL:       '*',
  AND:       'AND',
  ASC:       'ASC',
  DESC:      'DESC',
  FROM:      'FROM',
  JOIN:      'JOIN',
  WHERE:     'WHERE',
  LIMIT:     'LIMIT',
  SELECT:    'SELECT',
  OFFSET:    'OFFSET',
  INCLUDE:   'INCLUDE', // This is only an internal thing.
  ORDER_BY:  'ORDER BY',
  GROUP_BY:  'GROUP BY'
};

const operators = [
  '=',
  '<',
  '>',
  '!=',
];


//
// Model Attr class
module.exports = (() =>
{
  /**
   * Constructor
   *
   * @param {MySQL} sql
   * @param {Model} model
   */
  function constr(sql, model)
  {
    if (!model.table)
    {
      throw new Error('Table name not defined');
    }

    this.sql          = sql;
    this.model        = model;
    this.table        = model.table;
    this.chain        = [];
    this.order_values = [];
  };


  //
  // Methods
  mixin(constr.prototype, {
    /**
     * Same as exec.
     *
     * @return {promise}
     */
    all: function ()
    {
      return this.exec();
    },

    /**
     * Execute the query chain.
     *
     * @return {promise}
     */
    exec: function ()
    {
      return new promise((res, rej) => {
        //
        // Build query
        let state;
        let query = [];

        //
        // Use default select
        if (this.chain[0].type !== keywords.SELECT)
        {
          query.push(keywords.SELECT);
          query.push(this.table + '.' + keywords.ALL);
          query.push(keywords.FROM);
          query.push(this.table);
        }

        //
        // Process chain
        while (state = this.chain.shift())
        {
          let instructions = null;

          //
          // Process simple keyword
          if (typeof state === 'string')
          {
            query.push(state);
          }
          //
          // Process state
          else
          {
            switch (state.type)
            {
            case keywords.OR:
            case keywords.AND:
            case keywords.NOT:
            case keywords.WHERE:
              query.push(state.type);
              instructions = this.__prepare(state.values);
              break;

            case keywords.JOIN:
              query.push(state.type);
              instructions = this.__join(state.values);
              break;

            case keywords.SELECT:
              instructions = this.__select(state.values);
              break;
            }
          }

          //
          // Process Instructions
          if (instructions)
          {
            let i_i   = 0;
            let i_len = instructions.length;
            for (; i_i  < i_len; i_i++)
            {
              query.push(instructions[i_i]);
            }
          }
        }

        //
        // Limit/Offset
        if (this.limit_value)
        {
          query.push(keywords.LIMIT);
          query.push(this.limit_value);
        }

        if (this.offset_value)
        {
          query.push(keywords.OFFSET);
          query.push(this.offset_value);
        }


        //
        // Order
        let o     = keywords.ORDER_BY;
        let o_i   = 0;
        let o_len = this.order_values.length;
        for (; o_i < o_len; o_i++)
        {

        }


        //
        //Run query
        this.sql.do((err, conn) => {
          //
          // Handle error.
          if (err)
          {
            rej(err);
            return;
          }


          //
          // Do stuff.
          conn.query(query.join(' '), (err, rows, fields) => {
            //
            // Handle error.
            if (err)
            {
              rej(err);
              return;
            }

            //
            // Process data.
          });
        });
      });
    },

    /**
     * Return an empty array.
     *
     * @return {promise}
     */
    none: function ()
    {
      return new promise((res, rej) => {
        res([]);
      })
    },


    /**
     * From statement
     *
     * @param {string} table
     * @return {ModelQuery}
     */
    from: function (table)
    {
      return this;
    },

    /**
     * Join statement
     *
     * @param {string} table
     * @return {ModelQuery}
     */
    joins: function (table)
    {
      return this;
    },

    /**
     * Join statement
     * This one will also load the joined tables into relating models.
     *
     * @param {string} table
     * @return {ModelQuery}
     */
    includes: function (table)
    {
      this.chain.push()
      return this;
    },


    /**
     * Group statement
     *
     * @param {string|array} field
     * @return {ModelQuery}
     */
    group: function (field)
    {
      this.__pushNode(
        keywords.GROUP_BY,
        (typeof fields === 'string') ? [params] : params
      );

      return this;
    },


    /**
     * OR statement
     *
     * User.where('id = 1')
     *     .or('activated_at = NULL');
     *
     * User.where('id = 1')
     *     .or({ activated_at: null });
     *
     * User.where('activated_at = NULL')
     *     .or('id', [1, 2, 3, 4]);
     *
     * @param {object|string} params
     * @param {array} list
     * @return {ModelQuery}
     */
    or: function (params, list)
    {
      this.__clause(keywords.OR, params, list);
      return this;
    },

    /**
     * AND statement
     *
     * User.where('id = 1')
     *     .and('activated_at = NULL');
     *
     * User.where('id = 1')
     *     .and({ activated_at: null });
     *
     * User.where('activated_at = NULL')
     *     .and('id', [1, 2, 3, 4]);
     *
     * @param {object|string} params
     * @param {array} list
     * @return {ModelQuery}
     */
    and: function (params, list)
    {
      this.__clause(keywords.AND, params, list);
      return this;
    },

    /**
     * NOT clause.
     * This can be called after an empty clause:
     *
     * User.where().not('activated_at = NULL');
     *
     * @param {object|string} params
     * @param {array} list
     * @return {ModelQuery}
     */
    not: function (params, list)
    {
      this.__clause(keywords.NOT, params, list);
      return this;
    },

    /**
     * WHERE clause.
     *
     * User.where('activated_at = NULL');
     * User.where({ activated_at: null });
     *
     * User.where('id IN (1, 2, 3, 4)');
     * User.where('id', [1, 2, 3, 4]);
     *
     * @param {object|string} params
     * @param {array} list
     * @return {ModelQuery}
     */
    where: function (params, list)
    {
      this.__clause(keywords.WHERE, params, list);
      return this;
    },


    /**
     * Select.
     *
     * User.select('*');
     * User.select(['id', 'avatar']);
     *
     * @param {string|array} fields
     * @return {ModelQuery}
     */
    select: function (fields)
    {
      this.__pushNode(
        keywords.SELECT,
        (typeof fields === 'string') ? [fields] : fields
      );

      return this;
    },


    /**
     * Set query order.
     *
     * User.order('id');
     * User.order('id ASC');
     * User.order('id DESC');
     *
     * @return {string} params
     * @return {ModelQuery}
     */
    order: function (params)
    {
      //
      // Prepend table if it isn't defined.
      if (-1 == params.indexOf('.'))
      {
        params = table + '.' + params;
      }

      this.order_values.push(params);
      return this;
    },

    /**
     * Set query order.
     * This will actually ignore all previously set orders.
     *
     * User.order('id');
     * User.order('id ASC');
     * User.order('id DESC');
     *
     * @return {string} params
     * @return {ModelQuery}
     */
    reorder: function (params)
    {
      this.order_values = [params];
      return this;
    },


    /**
     * Set query limit.
     *
     * User.limit(1);
     *
     * @return {number} value
     * @return {ModelQuery}
     */
    limit: function (value)
    {
      this.limit_value = value;
      return this;
    },

    /**
     * Set query offset.
     *
     * User.offset(1);
     *
     * @return {number} value
     * @return {ModelQuery}
     */
    offset: function (value)
    {
      this.offset_value = value;
      return this;
    },


    /**
     * Compile join.
     *
     * @param {array} values
     * @return {array}
     */
    __join: function (values)
    {
      let istr = [];
      istr.push(keywords.JOIN);

      return istr;
    },

    /**
     * Compile select.
     *
     * @param {array} values
     * @return {array}
     */
    __select: function (values)
    {
      let istr = [];
      istr.push(keywords.SELECT);

      //
      // No fields supplied
      if (0 == statement.values.length)
      {
        istr.push(this.table + '.' + keywords.ALL);
        return;
      }

      // while ()
      // {
      //   istr.push(this.table + '.' + keywords.ALL);
      // }

      return istr;
    },


    /**
     * Preps an unsafe string.
     *
     * @param {array} value
     * @return {string}
     */
    __prep: function (value)
    {
      return '`' + value + '`';
    },

    /**
     * Escapes an unsafe string.
     *
     * @param {array} value
     * @return {string}
     */
    __escape: function (value)
    {
      return this.__prep(value.replace(/[\0\n\r\b\t\\'"\x1a]/g, (ch) => {
        switch (ch)
        {
        case "\0":
          return "\\0";

        case "\n":
          return "\\n";

        case "\r":
          return "\\r";

        case "\b":
          return "\\b";

        case "\t":
          return "\\t";

        case "\x1a":
          return "\\Z";

        case "'":
          return "''";

        case '"':
          return '""';

        default:
          return "\\" + ch;
        }
      }));
    },


    /**
     * Prepare instructions.
     *
     * @param {array} values
     * @return {array}
     */
    __prepare: function (values)
    {
      let istr = [];

      values.forEach((val) => {
        let parts     = val.split(' ');
        let parts_i   = 0;
        let parts_len = parts.length;
        if (parts_len != 3)
        {
          throw new Error ('Invalid parameters');
        }

        for (; parts_i < parts_len; parts_i++)
        {
          let part = parts[parts_i];
          switch (parts_i)
          {
          //
          // Field
          case 0:
            part = (-1 === part.indexOf('.'))
                 ? this.table + '.' + part
                 : part;

            break;


          //
          // Operator
          case 1:
            if (-1 === operators.indexOf(part))
            {
              throw new Error("Invalid operator: " + part);
            }

            break;


          //
          // Value
          case 2:
            part = this.__escape(part);
          }

          //
          // Push instruction if now error was thrown.
          istr.push(part);
        }
      });

      return istr;
    },

    /**
     * Prepare Clause.
     *
     * @param {string} type
     * @param {object|string} params
     * @param {array} list
     */
    __clause: function (type, params, list)
    {
      //
      // Empty
      if (arguments.length === 1)
      {
        this.chain.push(type);
        return;
      }

      this.__pushNode(
        type,
        (typeof params === 'string') ? [params] : params
      );
    },

    /**
     * Pushes a node onto the chain.
     *
     * @param {string} type
     * @param {object|string|array} values
     */
    __pushNode: function (type, values)
    {
      let node = new queryNode(type, values);
      this.chain.push(node);
    }
  });

  return constr;
})();
