var prompt = require('prompt');
module.exports = new Promise((ok, fail)=>{
// chiedo la configurazione
  prompt.start();
  prompt.get(['subdomain', 'email', 'password'], (err, result) => {
    if (err) fail(err);
    else ok(result);
  });
});
