/*
 * facebook-data-node
 */

var PollerFactory = require('poller-node');

module.exports = {

  opts : {
    poller : {
      do_polling : true,
      freq : 60*60*1000, 
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

  initPoller : function(users){
    var self = this;
    var opts = self.opts.poller;
    var poller = this.build();
    var bspool = require('beanstalk-node');
    poller.emitter.on('link', function(job){
      bspool.put(job, function(){
      });
    });
    bspool.emitter.on('log', function(e, msg){
      console.log(msg);
    });
    bspool.init(opts.beanstalk_opts, function(){
      poller.init(opts, function(){
        console.log('poller initialized');
      });
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
  }
}
