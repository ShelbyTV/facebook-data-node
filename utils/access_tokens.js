var dao = require('redis-daos').build('facebook-poller');

var num_users = 0;
var have_token = 0;

var callback = function(e, info){
  if (info.access_token){
    have_token+=1;
    console.log(have_token+'/'+num_users, 'have a token');
  }
};

dao.getUserSet(function(e, users){
  num_users = users.length;
  users.forEach(function(u){
    dao.getUserInfo(u, callback);
  });
});
