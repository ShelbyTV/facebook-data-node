var fbook = require('../index.js');

var test_bs_pool = require('beanstalk-node');

fbook.initBackfill(function(backfiller, bspool){
  console.log('backfill initted');  
});
