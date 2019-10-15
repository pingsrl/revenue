var _ = require('lodash');
var numeral = require('numeral');

numeral.register('locale', 'it', {
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
	ordinal: function(number) {
		return number === 1 ? 'mo' : 'mi';
	},
	currency: {
		symbol: '€'
	}
});

numeral.locale('it');

module.exports = function formatNumber(num) {
	return _.padStart(numeral(num).format('0,0'), 7);
};
