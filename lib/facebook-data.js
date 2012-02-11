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

  processError : function(error, uid, params){
    var should_delete = false;
    var bad_phrases = ['has changed the password', 'has not authorized application'];
    console.log(error);
    bad_phrases.forEach(function(phrase){
      if (error.indexOf(phrase)!==-1){
        should_delete = true;
      }
    });
    if (should_delete){
      return this.deleteUser(uid);
    }
  },

  deleteUser : function(uid){
    this.dao.deleteUser(uid, function(){
      console.log('DELETED', uid);
    });
  },

  /*
   * Issue here is that subsequent requests would 
   * write last_seen as earlier in time making the next
   * round of polling cover ground already covered
   */

  poll : function(uid){
    console.log('polling for' , uid);
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
            self.processError(feed.error.message, uid, params);
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

  _poll : function(uid, params, cb){
    var self = this;
    self.dao.getUserInfo(uid, function(e, info){
      params.access_token = info.access_token;
      
      self.graph.getHome(uid, params, function(e, feed){
        if (e || !feed || !feed.data || !feed.data.length){
          if (feed.error){
            self.processError(feed.error.message, uid, params);
          }
          return cb(true);
        } else {
          return cb(null, feed);
        }
      });
    });
  },

  firstBackfillUser : function(uid, times, max_times, params){
    console.log('initial backfill for', uid, 'time', times);
    var self = this;
    // gonna be dumb and do 3 reqs
    var params =  params || { since : 0, limit : 1000, metadata : 1 };
    this._poll(uid, params, function(e, feed){
      if (e) return false;
      if (times===max_times){
        self.setLastSeen(uid, feed.data);
      }
      feed.data.forEach(function(item){
        self.createJob(item, uid);  
      });
      if (times-1 === -1) return false;
      params = { since : 0, until : feed.data.pop().updated_time, limit : 1000, metadata : 1 };
      self.firstBackfillUser(uid, times - 1, params);
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

  getPagingParams : function(url){
    return this.querystring.parse(url.split('?')[1]);
  }

};
