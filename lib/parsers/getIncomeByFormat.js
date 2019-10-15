var moment = require('moment');
var debug = require('debug')('revenue-cli');
var _ = require('lodash');

module.exports = function() {
	return function getIncomeByFormat(payments, year, format, elements) {
		var r = new RegExp(`^${year}-`);
		debug('test %s', r);

		var payments = payments.filter(el => r.test(el.paid_at));
		debug('invoices %s', payments.length);
		var grouped = _(payments)
			.groupBy(invoice => {
				return moment(invoice.paid_at).format(format);
			})
			.value();
		debug('months %o', grouped);

		var points = [];
		var labels = Object.keys(grouped).sort();

		debug('months %o', labels);

		for (var i = 0; i < labels.length; i++) {
			var month = labels[i];

			debug('month %s', month);
			var payments = grouped[month];
			var sum = _(payments).sumBy(el => el.amount);

			points.push({
				name: month,
				amount: sum
			});
		}

		// add remaining months
		for (var i = 0; points.length < elements; i++) {
			points.push({
				name: points.length + 1 + '',
				percentage: 0,
				amount: 0
			});
		}

		return points;
	};
};
