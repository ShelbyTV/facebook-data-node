var fbook = require('../index.js');

var test_bs_pool = require('beanstalk-node');

var _opts = {
  resTube : 'default',
  putTube: 'fb_add_user',
  pool_size : 10,
};

var job = {
  "fb_id" : "1319152",
  "fb_access_token" : "AAABoqCJCWWMBAIFZArAMnLqVrLOZB5RPI9pQMQXxjNzrYVFnYZC2naQR1mSepwZAyGOEafM77w9mISRyhmd4kRs503AgjjgZD"
};

test_bs_pool.init(_opts, function(){
  test_bs_pool.put(job, function(){
    console.log('put job');
  });
});
