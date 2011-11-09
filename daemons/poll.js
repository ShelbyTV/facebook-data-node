try{
  var users = process.argv[2];

  if (!users){
    console.error('Must define users');
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

  fdata.initPoller(users, function(poller, bspool){ });
} catch (e){
  handleError(e);
}
