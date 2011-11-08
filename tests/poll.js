var fbook = require('../index.js');

fbook.initPoller(function(poller, bspool){
  setTimeout(function(){
    poller.stopPolling();
  }, 7000);
});
