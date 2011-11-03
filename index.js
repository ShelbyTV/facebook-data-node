/*
 * facebook-data-node
 */

module.exports = {

  build : function(){
    var poller_factory = require('poller-node');
    var sub = require('./lib/facebook-data.js');
    return poller_factory.build(sub);
  }

}
