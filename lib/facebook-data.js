/*
 * facebook-data : a poller-node sub
 */

module.exports = {

  graph : require('facebook-graph-node'),

  querystring : require('querystring'),

  dao : require('redis-daos').build('facebook-poller'),

  limit : 1000,

  newJob : function(){
    console.log('got new job');
  },

  getTime : function(){
    var ms = new Date().getTime();
    return Math.round(ms/1000);
  },

  buildJob : function(job){
    console.log('putting to beanstalk', job.url);
  },

  poll : function(uid){
    var self = this;
    self.dao.getUserInfo(uid, function(e, info){

      var params = {
        access_token : info.access_token,
        //since : info.last_seen || 0,
        since : 0,
        limit : 100,
        metadata : 1
      };
      console.log(params);
      self.getUserFeed(uid, params, function(e, feed){
        if (e || !feed || !feed.data){
          return console.log('log', 1, 'no data returned for :'+uid);
        }
        feed.data.forEach(function(item){
          if (item.type==='link' || item.type==='video'){
            self.buildJob({
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
