var moment = require('moment');
var debug = require('debug')('revenue-cli');
var _ = require('lodash');

module.exports = function({ INVOICE_OPEN, CLIENTS_SHOWN }) {
	return function getRevenueByClient(invoices, year, total) {
		var r = new RegExp(`^${year}-`);
		debug('test %s', r);

		var invoices = invoices.filter(el => r.test(el.issue_date));
		debug('invoices %s', invoices.length);
		var grouped = _(invoices)
			.groupBy(invoice => {
				return invoice.client.name;
			})
			.value();

		var clients = [];
		var labels = Object.keys(grouped).sort();

		for (var i = 0; i < labels.length; i++) {
			var client = labels[i];

			debug('client %s', client);
			var invoices = grouped[client];

			var sum = _(invoices).sumBy(el => {
				if (INVOICE_OPEN.indexOf(el.state) !== -1) {
					return el.amount - el.tax_amount;
				}
			});

			clients.push({
				name: client,
				percentage: Math.round((sum / total) * 100),
				amount: sum
			});
		}

		function sortNumber(a, b) {
			return a.amount - b.amount;
		}

		clients.sort(sortNumber);
		return _(clients)
			.reverse()
			.take(CLIENTS_SHOWN)
			.value();
	};
};
