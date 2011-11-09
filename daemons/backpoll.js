function handleError(e){
  console.error('ERROR:', e);  
}

process.on('uncaughtException', handleError);

try {

  var fbook = require('../index.js');
  fbook.initBackfill(function(backfiller, bspool){
    console.log('backpoll initted');  
  });

} catch (e){

  handleError(e);

}
