/*
 * Mult-process Facebook Poll
 */

var os = require('os');
var num_pollers = (process.argv[2]/1);
var num_cores = os.cpus().length;
var spawn = require('child_process').spawn;
var sys = require('sys');
var kids = [];
var NUM_COMPLETED = 0;
// 10 * 60 * 1000 (10 mins)
//var REBOOT_INTERVAL = 600000;
var REBOOT_INTERVAL = 6000;

if (num_pollers < 1){
  console.error('usage : node master_poll.js $num_pollers');
  console.error('$num_pollers : int');
  process.exit();
}

function restart(){
  console.log('restarting');
  killKids(); 
  initKids();
}

function killKids(){
  console.log('killing', kids.length, 'kids');
  while (kids.length){
    var _kid = kids.shift();
    _kid.kill();
  }
}

function getPrefix(rank){
  var prefix = '';
  for (var i=0;i<rank;i++){
    prefix+='*';
  }
  return prefix;
}

function initKid(rank){
  var kid = spawn('node', [__dirname+'/backpoll.js']);
  var pid = kid.pid;
  var prefix = getPrefix(rank);
  
  kid.stdout.setEncoding('utf8');
  kid.stderr.setEncoding('utf8');

  kid.stdout.on('data', function(data){
    sys.puts(prefix+' '+pid+": "+data);
  });

  kid.stderr.on('data', function(data){
    sys.puts(prefix+' **ERROR** '+pid+': '+data);
  });

  kid.on('exit', function(code){
    if (code !== 0){
      sys.puts(prefix+' '+pid+' died, with code '+code);
    }
  });

  kids.push(kid);
}

function initKids(chunks) {
  for (k = 0 ; k < num_pollers ; k++){
    initKid(k);
  }
}

process.on('SIGTERM', function(){
  console.error('Terminating Kids');
  killKids();
  process.exit();
});

initKids();
setTimeout(restart, REBOOT_INTERVAL);

