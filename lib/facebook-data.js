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

  getTime : function(){
    var ms = new Date().getTime();
    return Math.round(ms/1000);
  },

  poll : function(uid){
    var self = this;
    self.dao.getUserInfo(uid, function(e, info){

      var params = {
        access_token : info.access_token,
        since : info.last_seen || 0,
        limit : 500,
        metadata : 1
      };

      self.getUserFeed(uid, params, function(e, feed){

        if (e || !feed || !feed.data){
          return console.log('log', 1, 'no data returned for :'+uid);
        }

        feed.data.forEach(function(item){
          if ((item.type==='link' || item.type==='video') && (item.source || item.link)){
            self.emitter.emit('link',{ 
              "facebook_status_update" : item,
              "url" : item.source || item.link,
              "provider_type" : "facebook",
              "provider_user_id" : uid
            });
          }
        });
      });
    });
  },

  getUserFeed : function(uid, params, cb){
    var self = this;
    self.graph.getHome(uid, params, function(e, feed){
      if (!e && feed && feed.data && feed.data.length && feed.paging && feed.paging.next) {
        if (feed.paging && feed.paging.next){
          var _params = self.getPagingParams(feed.paging.next);
          self.getUserFeed(uid, _params, cb);  
        }
        self.dao.setUserProperty(uid, 'last_seen', self.getTime(), function(){});
        return cb(e, feed);
      }
    }); 
  },

  getPagingParams : function(url){
    return this.querystring.parse(url.split('?')[1]);
  }

};
