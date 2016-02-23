var blessed = require('blessed');
var contrib = require('blessed-contrib');
var moment = require('moment');
var numeral = require('numeral');
var _ = require('lodash');

var debug = require('debug')('visualizer');

const INVOICE_OPEN = ['open', 'paid'];
const INVOICE_PAID = ['paid'];
const CLIENTS_SHOWN = 50;

numeral.language('it', {
  delimiters: {
    thousands: '.',
    decimal: ','
  },
  abbreviations: {
    thousand: 'k',
    million: 'm',
    billion: 'b',
    trillion: 't'
  },
  ordinal : function (number) {
    return number === 1 ? 'mo' : 'mi';
  },
  currency: {
    symbol: '€'
  }
});

numeral.language('it');
function formatNumber(num){
  return _.padLeft(numeral(num).format('0,0'), 7);
}

function getRevenueByFormat(invoices, year, total, format, elements){
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
      if (INVOICE_OPEN.indexOf(el.state) !== -1) {
        return el.amount - el.tax_amount;
      }
    });

    points.push({
      name: month,
      percentage: Math.round(sum/total*100),
      amount: sum
    });
  };

  // add remaining months
  for (var i = 0; points.length < elements  ; i++) {
    points.push({
      name: (points.length + 1) + '',
      percentage: 0,
      amount: 0
    });
  };

  return points;
}

function getIncomeByFormat(payments, year, format, elements){
  var r = new RegExp(`^${year}-`);
  debug('test %s', r);

  var payments = payments.filter((el)=> r.test(el.paid_at));
  debug('invoices %s', payments.length);
  var grouped = _(payments).groupBy((invoice)=>{
    return moment(invoice.paid_at).format(format);
  }).value();
  debug('months %o', grouped);

  var points = [];
  var labels = Object.keys(grouped).sort();

  debug('months %o', labels);

  for (var i = 0; i < labels.length; i++) {
    var month = labels[i];

    debug('month %s', month);
    var payments = grouped[month];
    var sum = _(payments).sum((el) => el.amount);

    points.push({
      name: month,
      amount: sum
    });
  };

  // add remaining months
  for (var i = 0; points.length < elements  ; i++) {
    points.push({
      name: (points.length + 1) + '',
      percentage: 0,
      amount: 0
    });
  };

  return points;
}

function getTaxesByFormat(invoices, year, total, format, elemnts){
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
      if (INVOICE_OPEN.indexOf(el.state) !== -1) {
        return el.tax_amount;
      }
    });

    points.push({
      name: month,
      percentage: Math.round(sum/total*100),
      amount: sum
    });
  };

  // add remaining months
  for (var i = 0; points.length < elemnts  ; i++) {
    points.push({
      name: (points.length + 1) + '',
      percentage: 0,
      amount: 0
    });
  };

  return points;
}

function getRevenueByClient(invoices, year, total){
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
      if (INVOICE_OPEN.indexOf(el.state) !== -1) {
        return el.amount - el.tax_amount;
      }
    });

    clients.push({
      name: client,
      percentage: Math.round(sum/total*100),
      amount: sum
    });
  };

  function sortNumber(a,b) {
    return a.amount - b.amount;
  }

  clients.sort(sortNumber);
  return _(clients).reverse().take(CLIENTS_SHOWN).value();
}

function getRevenue(invoices, year){
  var r = new RegExp(`^${year}-`);
  return invoices.sum((el) => {
    if (r.test(el.issued_at) && INVOICE_OPEN.indexOf(el.state) !== -1) {
      return el.amount - el.tax_amount;
    }
  });
}


module.exports = function printResult(db, last_update, options) {
  var invoices = db('invoices');
  var payments = db('payments');

  var revenue = getRevenue(invoices, options.year);
  var revenueByMonth = getRevenueByFormat(invoices, options.year, revenue, 'MM', 12);
  var revenueByQuarter = getRevenueByFormat(invoices, options.year, revenue, 'Q', 4);

  var incomeByMonth = getIncomeByFormat(payments, options.year, 'MM', 12);
  var incomeByQuarter = getIncomeByFormat(payments, options.year, 'Q', 4);

  var taxesByQuarter = getTaxesByFormat(invoices, options.year, revenue, 'Q', 4);

  var taxes = _(taxesByQuarter).sum((el)=> el.amount);
  var income = _(incomeByQuarter).sum((el)=> el.amount);

  // Adding total to quarters
  revenueByQuarter.push({
    name: options.year,
    percentage: 0,
    amount: revenue
  });

  incomeByQuarter.push({
    name: options.year,
    percentage: 0,
    amount: income
  });

  taxesByQuarter.push({
    name: options.year,
    percentage: 0,
    amount: taxes
  });

  var revenueByClient = getRevenueByClient(invoices, options.year, revenue);

  var screen = blessed.screen();
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
    maxHeight: _.max(revenueByMonth, 'percentage').percentage,
    style:{
      fg: 'white',
    }
  });

  screen.append(bar);
  bar.setData({
    titles: _.map(revenueByMonth, (el) => el.name),
    data: _.map(revenueByMonth, (el) => el.percentage)
  });

  // Revenue by quarter
  var clientTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: 0,
    left: '80%',
    width: '20%',
    height: '25%',
    label: 'Net revenue',
    border: {type: 'line', fg: 'cyan'},
    columnSpacing: 5,
    columnWidth: [5, 12]
  });
  screen.append(clientTable);
  clientTable.setData({
    headers: ['Q', '€'],
    data: _.map(revenueByQuarter, (el)=> [el.name, formatNumber(el.amount)])
  });

  // Income by quarter
  var incomeTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: '25%',
    left: '80%',
    width: '20%',
    height: '25%',
    label: 'Gross income',
    border: {type: 'line', fg: 'yellow'},
    columnSpacing: 5,
    columnWidth: [5, 12]
  });
  screen.append(incomeTable);
  incomeTable.setData({
    headers: ['Q', '€'],
    data: _.map(incomeByQuarter, (el)=> [el.name, formatNumber(el.amount)])
  });

  // Taxes by quarter
  var taxesTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: '50%',
    left: '80%',
    width: '20%',
    height: '25%',
    label: 'VAT on revenue',
    border: {type: 'line', fg: 'red'},
    columnSpacing: 5,
    columnWidth: [5, 12]
  });
  screen.append(taxesTable);
  taxesTable.setData({
    headers: ['Q', '€'],
    data: _.map(taxesByQuarter, (el)=> [el.name, formatNumber(el.amount)])
  });


  // Taxes on income by quarter
  var incomeTaxesTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    interactive: false,
    top: '75%',
    left: '80%',
    width: '20%',
    height: '25%',
    label: 'VAT on income',
    border: {type: 'line', fg: 'green'},
    columnSpacing: 5,
    columnWidth: [5, 12]
  });
  screen.append(incomeTaxesTable);
  var vat = db('config').first().vat;
  incomeTaxesTable.setData({
    headers: ['Q', '€'],
    data: _.map(incomeByQuarter, (el)=> [el.name, formatNumber(el.amount - el.amount/(vat/100+1))])
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
    label: options.year + ' Overview' ,
    border: {type: 'line', fg: 'green'},
    columnSpacing: 4,
    columnWidth: [10, 4, 9, 9]
  });
  screen.append(monthsTable);
  monthsTable.setData({
    headers: ['Month', ' %', 'Revenue €', 'Income €'],
    data: _.map(revenueByMonth, (el,i)=> {return [
      moment().month(el.name-1).format('MMMM'),
      el.percentage,
      formatNumber(el.amount),
      formatNumber(incomeByMonth[i].amount)
    ];})
  });

  // Clients Revenue Table
  var clientTable = contrib.table({
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    top: '50%',
    left: '40%',
    width: '40%',
    interactive: true,
    height: '50%',
    label: 'Top clients revenue',
    border: {type: 'line', fg: 'cyan'},
    columnSpacing: 4,
    columnWidth: [20, 4, 10]
  });
  screen.append(clientTable);
  clientTable.focus();
  clientTable.setData({
    headers: ['Client', ' %', '€'],
    data: _.map(revenueByClient, (el)=> [el.name.substring(0,20), el.percentage, formatNumber(el.amount)])
  });

  screen.render();
};
