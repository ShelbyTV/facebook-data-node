/*
 * facebook-data : a poller-node sub
 */

module.exports = {

  graph : require('facebook-graph-node'),

  dao : require('redis-daos').build('facebook-poller'),

  limit : 1000,

  newJob : function(){
    console.log('got new job');
  },

  poll : function(uid){
    var self = this;
    self.getUserFeed(uid, function(){
      console.log(arguments);
    });
  },

  getUserFeed : function(uid, opts, cb){
    if (arguments.length===2){
      cb = opts;
    }
    var self = this;
    self.dao.getUserInfo(uid, function(e, info){
      var params = {
        access_token : info.access_token,
        //since : info.last_seen || 0,
        limit : 1000,
        metadata : 1
      };
      self.graph.getHome(uid, params, cb); 
    });
  }

};
