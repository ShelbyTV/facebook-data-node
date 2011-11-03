var fb_poller = require('../index.js').build();

var opts = {
  users : ['1319152'],
  do_polling : true,
  freq : 5000, //every five seconds
  beanstalk_opts : {
    resTube : 'fb_add_user',
    putTube : 'link_processing',
    pool_size : 200
  }
};

fb_poller.init(opts, function(){
 //fb_poller.poll('1319152');
});
