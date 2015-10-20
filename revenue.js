#! /usr/bin/env node

// update notifier
var updateNotifier = require('update-notifier');
var pkg = require('./package.json');
updateNotifier({pkg: pkg, updateCheckInterval:1}).notify();

const year = new Date().getFullYear();

// CLI
var program = require('commander');
program
  .version(pkg.version)
  .option('-f, --force', 'force update')
  .option('-y, --year [year]', 'specify a year different than ' + year, year)
  .parse(process.argv);

// actual code
require('./lib/invoices')(program);
