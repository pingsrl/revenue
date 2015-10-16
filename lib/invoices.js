var Harvest = require('harvest');
var numeral = require('numeral');
var colors = require('colors');
var moment = require('moment');
var qs = require('qs');
var debug = require('debug')('invoice');

module.exports = function(options){
  var clioptions = options;

  debug('options: %j', clioptions);
  return require('./db').then((db) => {

    const CONFIG = db('config').first();
    const INVOICE_STATES = ['open', 'paid'];
    const DATE_FORMAT = 'YYYY-MM-DD HH:mm';
    const MIN_INTERVAL = 30*60;

    debug('config: %o', CONFIG);

    var last_update;

    if (db('updates').exists()) {
      last_update = db('updates').first().updated_since;
      debug('last update: %s', last_update);
    }

    var harvest = new Harvest(CONFIG);
    var page = 0;


    var printResult = () => {
      console.log('     Revenue %s', clioptions.year.toString().yellow);
      console.log('---------------------');
      return printSection(clioptions);
    };

    var printSection = (options) => {
      var year = options.year;
      var quarter = options.quarter;
      var net = options.net;
      var gross = options.gross;

      if (!net && !gross) {
        net = gross = true;
      }

      debug('printSection');
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
        printSection({year,net,gross, quarter:'1'});
        printSection({year,net,gross, quarter:'2'});
        printSection({year,net,gross, quarter:'3'});
        printSection({year,net,gross, quarter:'4'});
        console.log('TOTAL');
        printSection({year,net,gross});
        return;
        break;

      default:
        r = new RegExp(`^${year}-`);
        break;
      }

      if (gross) {
        lordo = db('invoices').sum((el) => {
          if (r.test(el.issued_at) && INVOICE_STATES.indexOf(el.state) !== -1) {
            return el.amount;
          }
        });
        console.log('\tGross sales: %s €', numeral(lordo).format('0,0.00').blue);
      }

      if (net) {
        netto = db('invoices').sum((el) => {
          if (r.test(el.issued_at) && INVOICE_STATES.indexOf(el.state) !== -1) {
            return el.amount - el.tax_amount;
          }
        });
        console.log('\tNet sales: %s €', numeral(netto).format('0,0.00').green);
      }
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
          printResult();
        }
      });
    };

    if (!last_update || moment().unix() - moment(last_update, DATE_FORMAT).unix() > MIN_INTERVAL) {
      getList();
    }else{
      printResult();
    }
  });
};
