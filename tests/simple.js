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
  fb_poller.getUserFeed(opts.users[0], function(e, feed){
    var links = [];
    feed.data.forEach(function(item){
      if (item.type==='video' || item.type==='link'){
        links.push(item);
      }
    });
    console.log(links.length);
  });
});
