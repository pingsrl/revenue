const blessed = require('blessed');
const contrib = require('blessed-contrib');
const moment = require('moment');
const _ = require('lodash');
const debug = require('debug')('revenue-cli');

const OPTIONS = {
	INVOICE_OPEN: ['open', 'paid'],
	INVOICE_PAID: ['paid'],
	CLIENTS_SHOWN: 50
};

const formatNumber = require('./formatNumber.js');
const getRevenueByFormat = require('./getRevenueByFormat.js')(OPTIONS);
const getIncomeByFormat = require('./getIncomeByFormat.js')(OPTIONS);
const getTaxesByFormat = require('./getTaxesByFormat.js')(OPTIONS);
const getRevenueByClient = require('./getRevenueByClient.js')(OPTIONS);
const getRevenue = require('./getRevenue.js')(OPTIONS);

module.exports = function printResult(db, last_update, options) {
	var invoices = db.get('invoices');
	var payments = db.get('payments');

	var revenue = getRevenue(invoices, options.year);
	debug('revenue %s', revenue);
	var revenueByMonth = getRevenueByFormat(
		invoices,
		options.year,
		revenue,
		'MM',
		12
	);
	debug('revenueByMonth %o', revenueByMonth);
	var revenueByQuarter = getRevenueByFormat(
		invoices,
		options.year,
		revenue,
		'Q',
		4
	);
	debug('revenueByQuarter %o', revenueByQuarter);

	var incomeByMonth = getIncomeByFormat(payments, options.year, 'MM', 12);
	var incomeByQuarter = getIncomeByFormat(payments, options.year, 'Q', 4);

	var taxesByQuarter = getTaxesByFormat(
		invoices,
		options.year,
		revenue,
		'Q',
		4
	);

	var taxes = _(taxesByQuarter).sumBy(el => el.amount);
	var income = _(incomeByQuarter).sumBy(el => el.amount);

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
		style: {
			fg: 'white'
		}
	});

	screen.append(bar);
	bar.setData({
		titles: _.map(revenueByMonth, el => el.name),
		data: _.map(revenueByMonth, el => el.percentage)
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
		border: { type: 'line', fg: 'cyan' },
		columnSpacing: 5,
		columnWidth: [5, 12]
	});
	screen.append(clientTable);
	clientTable.setData({
		headers: ['Q', '€'],
		data: _.map(revenueByQuarter, el => [el.name, formatNumber(el.amount)])
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
		border: { type: 'line', fg: 'yellow' },
		columnSpacing: 5,
		columnWidth: [5, 12]
	});
	screen.append(incomeTable);
	incomeTable.setData({
		headers: ['Q', '€'],
		data: _.map(incomeByQuarter, el => [el.name, formatNumber(el.amount)])
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
		border: { type: 'line', fg: 'red' },
		columnSpacing: 5,
		columnWidth: [5, 12]
	});
	screen.append(taxesTable);
	taxesTable.setData({
		headers: ['Q', '€'],
		data: _.map(taxesByQuarter, el => [el.name, formatNumber(el.amount)])
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
		border: { type: 'line', fg: 'green' },
		columnSpacing: 5,
		columnWidth: [5, 12]
	});
	screen.append(incomeTaxesTable);
	var vat = db
		.get('config')
		.first()
		.value().vat;
	debug('vat value %s', vat);
	incomeTaxesTable.setData({
		headers: ['Q', '€'],
		data: _.map(incomeByQuarter, el => [
			el.name,
			formatNumber(el.amount - el.amount / (vat / 100 + 1))
		])
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
		label: options.year + ' Overview',
		border: { type: 'line', fg: 'green' },
		columnSpacing: 4,
		columnWidth: [10, 4, 9, 9]
	});
	screen.append(monthsTable);
	monthsTable.setData({
		headers: ['Month', ' %', 'Revenue €', 'Income €'],
		data: _.map(revenueByMonth, (el, i) => {
			return [
				moment()
					.month(el.name - 1)
					.format('MMMM'),
				el.percentage,
				formatNumber(el.amount),
				formatNumber(incomeByMonth[i].amount)
			];
		})
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
		border: { type: 'line', fg: 'cyan' },
		columnSpacing: 4,
		columnWidth: [20, 4, 10]
	});
	screen.append(clientTable);
	clientTable.focus();
	clientTable.setData({
		headers: ['Client', ' %', '€'],
		data: _.map(revenueByClient, el => [
			el.name.substring(0, 20),
			el.percentage,
			formatNumber(el.amount)
		])
	});

	screen.render();
};
