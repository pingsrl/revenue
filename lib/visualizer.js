var blessed = require('blessed');
var contrib = require('blessed-contrib');
var colors = require('colors');
var moment = require('moment');
var numeral = require('numeral');
var _ = require('lodash');

var debug = require('debug')('visualizer');

const INVOICE_STATES = ['open', 'paid'];
const CLIENTS_SHOWN = 50;

function formatNumber(num){
  return _.padLeft(numeral(num).format('0,0.00'), 10);
}

function getRevenueByFormat(invoices, year, gross, total, format, elemnts){
  var r = new RegExp(`^${year}-`);
  debug('test %s', r);

  var invoices = invoices.filter((el)=> r.test(el.issued_at));
  debug('invoices %s', invoices.length);
  var grouped = _(invoices).groupBy((invoice)=>{
    return moment(invoice.issued_at).format(format);
  }).value();
  debug('months %o', grouped);

  var points = [];
  var labels = Object.keys(grouped).sort();

  debug('months %o', labels);

  for (var i = 0; i < labels.length; i++) {
    var month = labels[i];

    debug('month %s', month);
    var invoices = grouped[month];
    var sum = _(invoices).sum((el)=>{
      if (INVOICE_STATES.indexOf(el.state) !== -1) {
        return gross ? el.amount : el.amount - el.tax_amount;
      }
    });

    points.push({
      name: month,
      percentage: Math.round(sum/total*100),
      invoiced: sum
    });
  };

  // add remaining months
  for (var i = 0; points.length < elemnts  ; i++) {
    points.push({
      name: (points.length + 1) + '',
      percentage: 0,
      invoiced: 0
    });
  };

  return points;
}

function getRevenueByClient(invoices, year, gross, total){
  var r = new RegExp(`^${year}-`);
  debug('test %s', r);

  var invoices = invoices.filter((el)=> r.test(el.issued_at));
  debug('invoices %s', invoices.length);
  var grouped = _(invoices).groupBy((invoice) => invoice.client_name).value();

  var clients = [];
  var labels = Object.keys(grouped).sort();

  for (var i = 0; i < labels.length; i++) {
    var client = labels[i];

    debug('client %s', client);
    var invoices = grouped[client];

    var sum = _(invoices).sum((el)=>{
      if (INVOICE_STATES.indexOf(el.state) !== -1) {
        return gross ? el.amount : el.amount - el.tax_amount;
      }
    });

    clients.push({
      name: client,
      percentage: Math.round(sum/total*100),
      invoiced: sum
    });
  };

  function sortNumber(a,b) {
    return a.invoiced - b.invoiced;
  }

  clients.sort(sortNumber);
  return _(clients).reverse().take(CLIENTS_SHOWN).value();
}

function getRevenue(invoices, year, gross){
  var r = new RegExp(`^${year}-`);
  return invoices.sum((el) => {
    if (r.test(el.issued_at) && INVOICE_STATES.indexOf(el.state) !== -1) {
      return gross ? el.amount : el.amount - el.tax_amount;
    }
  });
}

var screen = blessed.screen();
module.exports = function printResult(invoices, clioptions) {
  var gross = clioptions.gross === true;

  var netRevenue = getRevenue(invoices, clioptions.year, false);
  var grossRevenue = getRevenue(invoices, clioptions.year, true);

  var netRevenueByMonth = getRevenueByFormat(invoices, clioptions.year, gross, netRevenue, 'MM', 12);
  var netRevenueByQuarter = getRevenueByFormat(invoices, clioptions.year, gross, netRevenue, 'Q', 4);
  // Adding total to quarters
  netRevenueByQuarter.push({
    name: clioptions.year,
    percentage: 0,
    invoiced: netRevenue
  });
  var netRevenueByClient = getRevenueByClient(invoices, clioptions.year, gross, netRevenue);

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });


  // Revenue per month
  var bar = contrib.bar({
    top: 'top',
    left: 0,
    width: '80%',
    height: '50%',
    label: 'Net Revenue per Month in %',
    barWidth: 4,
    barSpacing: 1,
    xOffset: 0,
    maxHeight: _.max(netRevenueByMonth, 'percentage').percentage,
    style:{
      fg: 'white',
    }
  });

  screen.append(bar);
  bar.setData({
    titles: _.map(netRevenueByMonth, (el) => el.name),
    data: _.map(netRevenueByMonth, (el) => el.percentage)
  });

  // Revenue by quarter
  var clientTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: 0,
    left: '75%',
    width: '25%',
    height: '50%',
    label: 'Revenue',
    border: {type: 'line', fg: 'cyan'},
    columnSpacing: 5, //in chars
    columnWidth: [5, 12] /*in chars*/
  });
  screen.append(clientTable);
  clientTable.setData({
    headers: ['Q', '€'],
    data: _.map(netRevenueByQuarter, (el)=> [el.name, formatNumber(el.invoiced)])
  });

  // Months Revenue Table
  var monthsTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: '50%',
    left: 0,
    width: '40%',
    height: '50%',
    label: clioptions.year + ' overview' ,
    border: {type: 'line', fg: 'green'},
    columnSpacing: 4, //in chars
    columnWidth: [10, 4, 10] /*in chars*/
  });
  screen.append(monthsTable);
  monthsTable.setData({
    headers: ['Month', '%', '€'],
    data: _.map(netRevenueByMonth, (el)=> [moment().month(el.name-1).format('MMMM'), el.percentage, formatNumber(el.invoiced)])
  });

  // Clients Revenue Table
  var clientTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: '50%',
    left: '40%',
    width: '60%',
    interactive: true,
    height: '50%',
    label: 'Top Clients',
    border: {type: 'line', fg: 'cyan'},
    columnSpacing: 4, //in chars
    columnWidth: [35, 4, 10] /*in chars*/
  });
  screen.append(clientTable);
  clientTable.focus();
  clientTable.setData({
    headers: ['Client', '%', '€'],
    data: _.map(netRevenueByClient, (el)=> [el.name, el.percentage, formatNumber(el.invoiced)])
  });

  screen.render();
};
