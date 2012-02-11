/*
 * facebook-data-node
 */

var PollerFactory = require('poller-node');

var bfiller = {

  stats:{
    jobs_built : 0
  },

  opts : {
    backfill : {
      do_polling : false,
    }
  },

  bstalk_opts : {
    backfill : {
        resTube : 'fb_add_user',
        putTube : 'link_processing_high',
        pool_size : '200'
    }
  },

  build : function(){
    var sub = require('../lib/facebook-data.js');
    return PollerFactory.build(sub);
  },

  initBackfill : function(cb){
    var self = this;
    var opts = self.opts.backfill;
    var bs_opts = self.bstalk_opts.backfill;
    var bspool = require('beanstalk-node');
    var backfiller = this.build();
    backfiller.graph.agent.maxSockets = Infinity;
    
    bspool.init(bs_opts, function(){
      backfiller.init(opts);
      self.pollStats(3000, bspool, backfiller);
      return cb(backfiller);
    });

  },

  pollStats : function(interval, bspool, poller){
    var self = this;
    setInterval(function(){
      var out = '';
      if (self.stats.jobs_built){
        out+='jobs: '+self.stats.jobs_built;
      }
      if (bspool){
        out+=' bstalk workers: '+bspool.respool.pool.length;
      }
      if (poller){
        out+=' http queue: '+poller.graph.agent.queue.length;
        out+=' http sockets: '+poller.graph.agent.sockets.length;
        if (poller.users){
          out+=' current user:'+poller.current+' of '+poller.users.length+' users';
        }
      }
      console.log(out);
    },interval);
  }
};

/*
 * Idea here is to rewrite the 
 * addUser code so that more data is polled
 * on signup (but not on backfill);
 */

bfiller.initBackfill(function(bf){
  var ids = {};
  bf.emitter.on('link', function(job){
    if (ids[job.facebook_status_update.id]){
      ids[job.facebook_status_update.id] += 1;
    } else {
      ids[job.facebook_status_update.id] = 0;
    }
    //console.log('GOT LINK', job);
  });

  var info = {
    "facebook_id" : '1319152',
    "access_token" : 'AAABoqCJCWWMBAIhTfcx8S7kU5kUt5RF54WAX7JywpT463qRZAfI5H6plVEJPrqSJtzARkEYZCj9uHLTOU2BZB4gLtyQdD8ZD' 
  };

  bf.dao.deleteUserFromSet(info.facebook_id, function(){
    bf.dao.userIsInSet(info.facebook_id, function(e, in_set){
      bf.addUser(info.facebook_id, info, function(){
        if (in_set){
          bf.backfillUser(info.facebook_id);
        } else {
          bf.firstBackfillUser(info.facebook_id, 3, 3);
        }
      });
    });
  });

  setTimeout(function(){
    console.log(ids, Object.keys(ids).length);
  }, 120000);
  
});
