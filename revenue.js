#! /usr/bin/env node

// update notifier
var pkg = require('./package.json');
var updateNotifier = require('update-notifier');
var program = require('commander');
var revenue = require('revenue-core');
var Spinner = require('cli-spinner').Spinner;
var configurator = require('./lib/configator');
var visualizer = require('./lib/visualizer');

// Update notification
updateNotifier({ pkg: pkg, updateCheckInterval: 1 }).notify();

// Setting up spinner
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

spinner.start();
// Getting invoices
revenue(program, configurator, (db, lastUpdate, options) => {
	spinner.stop(true);
	visualizer(db, lastUpdate, options);
});
