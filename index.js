/*
 * facebook-data-node
 */

var PollerFactory = require('poller-node');

module.exports = {

  stats:{
    jobs_built : 0
  },

  opts : {
    poller : {
      do_polling : true,
      freq : 30*60*1000, 
      //freq : 10*1000, 
    },
    backfill : {
      do_polling : false,
    }
  },

  bstalk_opts : {
    poller : {
      resTube : 'default',
      putTube : 'link_processing',
      pool_size : '200'
    },
    backfill : {
        resTube : 'fb_add_user',
        putTube : 'link_processing_high',
        pool_size : '200'
    }
  },

  build : function(){
    var sub = require('./lib/facebook-data.js');
    return PollerFactory.build(sub);
  },

  initPoller : function(users, cb){
    var self = this;
    var opts = self.opts.poller;
    var bs_opts = self.bstalk_opts.poller;
    var bspool = require('beanstalk-node');
    var poller = this.build();
    poller.graph.agent.maxSockets = Infinity;

    if (Array.isArray(users)){
      opts.users = users;
    }

    poller.emitter.on('link', function(job){
      bspool.put(job, function(){
        self.stats.jobs_built+=1;
      });
    });

    bspool.init(bs_opts, function(){
      poller.init(opts);
      self.pollStats(3000, bspool, poller);
      return cb(poller, bspool);
    });
  },

  initBackfill : function(cb){
    var self = this;
    var opts = self.opts.backfill;
    var bs_opts = self.bstalk_opts.backfill;
    var bspool = require('beanstalk-node');
    var backfiller = this.build();
    backfiller.graph.agent.maxSockets = Infinity;

    backfiller.emitter.on('link', function(job){
      bspool.put(job, function(){
        self.stats.jobs_built+=1;
      });
    });

    bspool.emitter.on('newjob', function(job, del){
      console.log('backpolling:', job.fb_id);

      var info = {
        "facebook_id" : job.fb_id,
        "access_token" : job.fb_access_token
      };

      backfiller.addUser(job.fb_id, info, function(){
        backfiller.backfillUser(job.fb_id);
      });

      del();
    });

    bspool.init(bs_opts, function(){
      backfiller.init(opts);
      self.pollStats(3000, bspool, backfiller);
      return cb(bspool, backfiller);
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
        out+=' current user:'+poller.current+' of '+poller.users.length+' users';
      }
      console.log(out);
    },interval);
  }
}
