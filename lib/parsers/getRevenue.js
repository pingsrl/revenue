module.exports = function({ INVOICE_OPEN }) {
	return function getRevenue(invoices, year) {
		var r = new RegExp(`^${year}-`);
		return invoices
			.sumBy(el => {
				if (r.test(el.issue_date) && INVOICE_OPEN.indexOf(el.state) !== -1) {
					return el.amount - el.tax_amount;
				}
			})
			.value();
	};
};
