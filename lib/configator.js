var prompt = require('prompt');
var debug = require('debug')('revenue-cli');

module.exports = function(db){
  debug('checking config');
  var configs = db.get('config').value();
  if (configs.length && typeof configs[0].vat === 'number') {
    debug('complete');

    return configs[0];

  }else if(configs[0] && typeof configs[0].vat === 'undefined'){
    debug('missing VAT');

    return new Promise((ok, fail)=>{
      prompt.start();
      prompt.get([{
        name:'vat',
        description: 'VAT percentage',
        required: true,
        type: 'number',
        pattern: /^[0-9]+$/
      }], (err, result) => {
        if (err) {
          fail(err);
        }
        else {
          var config = configs[0];
          config.vat = result.vat;
          ok(config);
        }
      });
    });

  }else{
    debug('missing config');

    return new Promise((ok, fail)=>{
      // prompt for config info
      prompt.start();
      prompt.get([{
        name:'subdomain',
        required: true,
        pattern: /^\w+$/
      }, {
        name:'email',
        required: true,
      }, {
        name:'password',
        required: true,
        hidden: true,
      },{
        name:'vat',
        description: 'VAT percentage',
        required: true,
        type: 'number',
        pattern: /^[0-9]+$/
      }], (err, result) => err ? fail(err) : ok(result) );
    });
  }
};
