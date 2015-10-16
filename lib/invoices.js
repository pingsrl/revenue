var Harvest = require('harvest');
var numeral = require('numeral');
var colors = require('colors');
var moment = require('moment');
var qs = require('qs');
var debug = require('debug')('invoice');

module.exports = function(options){
  var year = options.year;
  var quarter = options.quarter;
  debug('options: %j', {year, quarter});
  return require('./db').then((db) => {

    const CONFIG = db('config').first();
    const INVOICE_STATES = ['open', 'paid'];
    const DATE_FORMAT = 'YYYY-M-d h:mm';
    const MIN_INTERVAL = 30*60;

    debug('config: %o', CONFIG);

    var last_update;

    if (db('updates').exists()) {
      last_update = db('updates').first().updated_since;
      debug('last update: %s', last_update);
    }

    var harvest = new Harvest(CONFIG);
    var page = 0;


    var showResults = (options) => {
      var year = options.year;
      var quarter = options.quarter;

      debug('showResults');
      var netto = 0;
      var lordo = 0;

      var r;
      switch (quarter){
      case ('1'):
        console.log('Q1');
        r = new RegExp(`^${year}-(01|02|03)`);
        break;

      case ('2'):
        console.log('Q2');
        r = new RegExp(`^${year}-(04|05|06)`);
        break;

      case ('3'):
        console.log('Q3');
        r = new RegExp(`^${year}-(07|08|09)`);
        break;

      case ('4'):
        console.log('Q4');
        r = new RegExp(`^${year}-(10|11|12)`);
        break;

      case (true):
        showResults({year, quarter:'1'});
        showResults({year, quarter:'2'});
        showResults({year, quarter:'3'});
        showResults({year, quarter:'4'});
        console.log('TOTAL');
        showResults({year});
        return;
        break;

      default:
        r = new RegExp(`^${year}-`);
        break;
      }

      lordo = db('invoices').sum((el) => {
        if (r.test(el.issued_at) && INVOICE_STATES.indexOf(el.state) !== -1) {
          return el.amount;
        }
      });
      netto = db('invoices').sum((el) => {
        if (r.test(el.issued_at) && INVOICE_STATES.indexOf(el.state) !== -1) {
          return el.amount - el.tax_amount;
        }
      });
      console.log('\tGross sales: %s €', numeral(lordo).format('0,0.00').blue);
      console.log('\tNet sales: %s €', numeral(netto).format('0,0.00').green);
    };

    var getList = () => {
      page++;

      var query = qs.stringify({
        updated_since: last_update,
        page: page
      }, {arrayFormat: 'brackets'});

      harvest.Invoices.list(query, (err, data)=> {
        if (err) {
          console.log(err);
          return;
        }
        for (var i = 0; i < data.length; i++) {
          var invoice = data[i].invoices;
          db('invoices').upsert(invoice);
        };
        debug('getList: page %s', page);
        if (data.length) {
          getList();
        }else{
          var now = moment().format(DATE_FORMAT);
          db('updates').upsert({id:0, updated_since: now});
          debug('updated %s', now);
          console.log('     Revenue %s', year.toString().yellow);
          console.log('---------------------');
          return showResults({year, quarter});
        }
      });
    };

    if (!last_update || moment.unix() - moment(last_update, DATE_FORMAT).unix() > MIN_INTERVAL) {
      getList();
    }else{
      console.log('     Revenue %s', year.toString().yellow);
      console.log('---------------------');
      showResults({year, quarter});
    }
  });
};
