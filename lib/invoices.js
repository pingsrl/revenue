var Harvest = require('harvest');
var numeral = require('numeral');
var colors = require('colors');
var qs = require('qs');


module.exports  = function(config, options){
  var harvest = new Harvest(config);
  var year = options.year;
  var netto = 0;
  var lordo = 0;
  var page = 0;

  var getList = (cb)=>{
    page++;

    var query = qs.stringify({
      from: `${year}0101`,
      to: `${year}1231`,
      status: ['open', 'paid'],
      page: page
    }, {arrayFormat: 'brackets'});

    harvest.Invoices.list(query, (err, data)=> {
      if (err) {
        console.log(err);
        return;
      }
      for (var i = 0; i < data.length; i++) {
        var invoice = data[i].invoices;
        lordo += invoice.amount;
        netto += invoice.amount - invoice.tax_amount;
      };
      if (data.length) {
        getList(cb);
      }else{
        return cb();
      }
    });

  };

  getList(()=>{
    console.log('Revenue %s', year);
    console.log('\tGross sales: %s €',numeral(lordo).format('0,0.00').blue);
    console.log('\tNet sales: %s €',numeral(netto).format('0,0.00').green);
  });
};
