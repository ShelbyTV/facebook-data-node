var fb_poller = require('../index.js').build();

var opts = {
  users : ['1319152'],
  do_polling : false,
  freq : 5000, //every five seconds
  beanstalk_opts : {
    resTube : 'fb_add_user',
    putTube : 'link_processing',
    pool_size : 200
  }
};

fb_poller.init(opts, function(){
  fb_poller.dao.getUserInfo(opts.users[0], function(e, info){
    var params = {
      access_token : info.access_token,
      //since : 0,
      limit : 100,
      metadata : 1
    };
    fb_poller.getUserFeed(opts.users[0], params, function(e, feed){
      if (e && !feed){
        return console.log('error:', e);
      }
      var items = [];
      feed.data.forEach(function(item){
        if (item.type==='link' || item.type==='video'){
          items.push(item);
        }
      });
      console.log(items.length);
    });
  });
});
