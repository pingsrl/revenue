#! /usr/bin/env node

// update notifier
var program = require('commander');
var updateNotifier = require('update-notifier');
var invoices = require('revenue-core');

// Update notification
var pkg = require('./package.json');
updateNotifier({pkg: pkg, updateCheckInterval:1}).notify();

// Setting up spinner
var Spinner = require('cli-spinner').Spinner;
var spinner = new Spinner('Loading data...this can take a while.. %s');
spinner.setSpinnerString('|/-\\');

// Current year
const year = new Date().getFullYear();

// CLI interface
program
  .version(pkg.version)
  .option('-f, --force', 'force update')
  .option('-y, --year [year]', 'specify a year different than ' + year, year)
  .parse(process.argv);

var configurator = require('./lib/configator');
var visualizer = require('./lib/visualizer');

spinner.start();
// Getting invoices
invoices(program, configurator, (db, lastUpdate, options) => {
  spinner.stop(true);
  visualizer(db, lastUpdate, options);
});
