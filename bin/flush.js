#!/usr/bin/env node

/*
 *
 * flush.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 13-10-2016
 *
 * (c) Laviréo 2016
 */


const fs      = require('fs-plus');
const path    = require('path');

const flush   = require('../lib/flush');
const methods = {
  help: function ()
  {
    this.version();
    this.usage();
  },

  usage: function ()
  {
    console.log('Usage:');
    console.log('\tnew <name> - Generate a new app called <name>');
    console.log('\tgen <type> <name> - Generates a new <type> called <name>\n');
  },

  version: function ()
  {
    console.log('Flush v' + flush.version + '\n');
  },


  new: function (name)
  {
  },

  gen: function (type, name)
  {
  }
}


//
// Entry Point
!((args) => {
  let cmd = args.shift();

  if (!cmd)
    methods.help();
  else
  {
       methods[cmd]
    && methods[cmd].apply(methods, args);
  }
})(process.argv.slice(2));
