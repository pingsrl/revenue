#! /usr/bin/env node
var program = require('commander');

var updateNotifier = require('update-notifier');
var pkg = require('./package.json');
updateNotifier({pkg: pkg, updateCheckInterval:1}).notify();

const year = new Date().getFullYear();

program
  .version(pkg.version)
  .command('revenue')
  .option('-y, --year [year]', 'specify a year different than ' + year, year)
  .option('-n, --net', 'net only')
  .option('-g, --gross', 'gross only')
  .option('-q, --quarter [quarter]', 'specify a quarter (1,2,3,4) or just -q for all', /^(1|2|3|4)$/i)
  .parse(process.argv);

require('./lib/invoices')(program);
