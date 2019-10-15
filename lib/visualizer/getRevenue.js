module.exports = function({ INVOICE_OPEN }) {
	return function getRevenue(invoices, year) {
		var r = new RegExp(`^${year}-`);
		return invoices
			.sumBy(el => {
				if (r.test(el.issued_at) && INVOICE_OPEN.indexOf(el.state) !== -1) {
					return el.amount - el.tax_amount;
				}
			})
			.value();
	};
};
