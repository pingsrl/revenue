var fs = require('fs');
var path = require('path');
var low = require('lowdb');

const home_dir = path.resolve(process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']);
const filename = '.revenue_config';

var db = low(home_dir + '/' + filename);
var _ = db._;

db._.mixin({
  upsert: function(collection, obj, key) {
    key = key || 'id';
    for (var i = 0; i < collection.length; i++) {
      var el = collection[i];
      if(el[key] === obj[key]){
        collection[i] = obj;
        return collection;
      }
    };
    collection.push(obj);
  },
  exists: function(collection){
    return collection.length > 0;
  }
});

module.exports = new Promise((ok, fail)=>{

  // Do I have a config file ?
  fs.access(home_dir + '/' + filename, fs.R_OK, (err) =>{
    err ? fail() : ok();
  });

}).then(()=>{

  // Does the configuration exists ?
  if (db('config').exists()) {
    return db('config').first();
  }else{
    return require('./config');
  }

}).then((config)=>{

  config.id = 0;
  db('config').upsert(config);

}).catch((err)=>{

  console.log(err);

}).then(()=>{

  return db;

});
