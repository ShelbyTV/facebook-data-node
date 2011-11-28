var dao = require('redis-daos').build('facebook-poller');

var complete = 0;

var callback = function(){
  complete+=1;
  console.log(complete, 'completed');
};

dao.getUserSet(function(e, users){
  var now = Math.round((new Date().getTime())/1000);
  console.log(now);
  console.log('updating', users.length, 'users to', now);
  users.forEach(function(u){
    dao.setUserProperty(u, 'last_seen', now, callback);
  });
});
