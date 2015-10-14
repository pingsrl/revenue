#! /usr/bin/env node
var program = require('commander');
var fs = require('fs');
var path = require('path');
var invoices = require('./lib/invoices');

function getConfigPath() {
  return path.resolve(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] +'/.fatturato');
}

program
  .version('1.0.0')
  .option('-y, --year [year]', 'specify a year different than [year]' , new Date().getFullYear())
  // .option('-q, --quarter <quarter>', 'specify a quarter (1,2,3,4)', /^(1|2|3|4)$/i , '1')
  .parse(process.argv);

var config;
try {
  config = JSON.parse(fs.readFileSync(getConfigPath()));
}
catch (e) {
  var prompt = require('prompt');
  prompt.start();
  prompt.get(['subdomain', 'email', 'password'], function (err, result) {
    config = result;
    if (config) {
      fs.writeFileSync(getConfigPath(), JSON.stringify(config));
      invoices(config, program);
    }
  });
}
finally{
  if (config && program.year) {
    invoices(config, program);
  }
}
