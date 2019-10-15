var moment = require('moment');
var debug = require('debug')('revenue-cli');
var _ = require('lodash');

module.exports = function({ INVOICE_OPEN }) {
	return function getTaxesByFormat(invoices, year, total, format, elemnts) {
		var r = new RegExp(`^${year}-`);
		debug('test %s', r);

		var invoices = invoices.filter(el => r.test(el.issued_at));
		debug('invoices %s', invoices.length);
		var grouped = _(invoices)
			.groupBy(invoice => {
				return moment(invoice.issued_at).format(format);
			})
			.value();
		debug('months %o', grouped);

		var points = [];
		var labels = Object.keys(grouped).sort();

		debug('months %o', labels);

		for (var i = 0; i < labels.length; i++) {
			var month = labels[i];

			debug('month %s', month);
			var invoices = grouped[month];
			var sum = _(invoices).sumBy(el => {
				if (INVOICE_OPEN.indexOf(el.state) !== -1) {
					return el.tax_amount;
				}
			});

			points.push({
				name: month,
				percentage: Math.round((sum / total) * 100),
				amount: sum
			});
		}

		// add remaining months
		for (var i = 0; points.length < elemnts; i++) {
			points.push({
				name: points.length + 1 + '',
				percentage: 0,
				amount: 0
			});
		}

		return points;
	};
};
