/*
 * facebook-data : a poller-node sub
 */

var EE2 = require('eventemitter2').EventEmitter2;

module.exports = {

  graph : require('facebook-graph-node'),

  emitter : new EE2(),

  querystring : require('querystring'),

  dao : require('redis-daos').build('facebook-poller'),

  limit : 1000,

  getTimestamp : function(date){
    return Math.round(new Date(date).getTime()/1000);
  },

  poll : function(uid){
    var self = this;
    self.dao.getUserInfo(uid, function(e, info){
      var params = {
        access_token : info.access_token,
        since : info.last_seen || 0,
        limit : 1000,
        metadata : 1
      };
      self.graph.getHome(uid, params, function(e, feed){
        if (e || !feed || !feed.data || !feed.data.length){
          if (feed.error){
            return console.error(feed.error);
          }
          return;
        } else {
          self.setLastSeen(uid, feed.data);
          feed.data.forEach(function(item){
            self.createJob(item, uid);  
          });
        }
      });
    });
  },

  createJob : function(item, uid){
    var self = this;
    if ((item.type==='link' || item.type==='video') && (item.source || item.link)){
      self.emitter.emit('link',{ 
        "facebook_status_update" : item,
        "url" : item.source || item.link,
        "provider_type" : "facebook",
        "provider_user_id" : uid
      });
    }
  },

  setLastSeen : function(uid, feedData){
    var latest = feedData[0];
    this.dao.setUserProperty(uid, 'last_seen', this.getTimestamp(latest.updated_time), function(){});
  },

  /*getUserFeed : function(uid, params, cb){
    self.graph.getHome(uid, params, function(e, feed){
      if (!e && feed && feed.data && feed.data.length && feed.paging && feed.paging.next) {
        if (feed.paging && feed.paging.next){
          var _params = self.getPagingParams(feed.paging.next);
          self.getUserFeed(uid, _params, cb);  
        }
        return cb(e, feed);
      }
    });
  },*/

  getPagingParams : function(url){
    return this.querystring.parse(url.split('?')[1]);
  }

};
