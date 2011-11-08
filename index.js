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
      beanstalk_opts :{
        resTube : 'default',
        putTube : 'link_processing',
        pool_size : '200'
      }
    },
    backfill : {
      do_polling : false,
      beanstalk_opts : {
        resTube : 'fb_add_user',
        putTube : 'link_processing_high',
        pool_size : '200'
      }
    }
  },

  build : function(){
    var sub = require('./lib/facebook-data.js');
    return PollerFactory.build(sub);
  },

  initPoller : function(cb){

    var self = this;
    var opts = self.opts.poller;
    var poller = this.build();
    poller.graph.agent.maxSockets = Infinity;

    var bspool = require('beanstalk-node');

    poller.emitter.on('link', function(job){
      bspool.put(job, function(){
        self.stats.jobs_built+=1;
      });
    });

    bspool.emitter.on('log', function(e, msg){
      //console.log(msg);
    });

    bspool.init(opts.beanstalk_opts, function(){
      poller.init(opts);
      self.pollStats(3000, bspool, poller);
      return cb(poller, bspool);
    });
  },

  initBackfill : function(){
    var backfiller = this.build();
    var bspool = require('beanstalk-node');
    bspool.emitter.on('newjob', function(job){
      backfiller.addUser(job);
      backfill.backfillUser(job);
    });
    backfiller.emitter.on('link', function(job){
      bspool.put(job, function(){
        console.log('backfill job put');
      });
    });
    bspool.init(this.poller.beanstalk_opts, function(){
      backfiller.init(opts.backfill, function(){
        console.log('backfill initialized');
      });
    });
  },

  pollStats : function(interval, bspool, poller){
    var self = this;
    setInterval(function(){
      console.log('=====================');
      if (self.stats.jobs_built){
        console.log('jobs built:', self.stats.jobs_built);
      }
      if (bspool){
        console.log('bstalk workers:', bspool.respool.pool.length);
      }
      if (poller){
        console.log('http agent queue:', poller.graph.agent.queue.length);
      }
      if (poller){
        console.log('http agent sockets:', poller.graph.agent.sockets.length);
      }
      console.log('=====================');
    },interval);
  }
}
