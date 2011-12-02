try{
  var users = process.argv[2];
  var freq = process.argv[3];

  if (!users || !freq){
    console.error('Must define users & freq');
    process.exit();
  }

  users = users.split(',');

  if (!Array.isArray(users)){
    console.error('Users must be an array');
    process.exit();
  }

  function handleError(){
    console.log('ERROR', error);  
  }

  process.on('uncaughtException', handleError);

  var fdata = require('../index.js');

  fdata.initPoller(users, freq, function(poller, bspool){ });
} catch (e){
  handleError(e);
}
