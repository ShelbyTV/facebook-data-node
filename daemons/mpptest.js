/*
 * Mult-process Facebook Poll
 */

var os = require('os');
var num_pollers = (process.argv[2]/1);
var num_users = (process.argv[3]/1);
var num_cores = os.cpus().length;
var dao = require('redis-daos').build('facebook-poller');
var spawn = require('child_process').spawn;
var sys = require('sys');
var kids = [];
var NUM_COMPLETED = 0;

if (!num_pollers || num_pollers > num_cores || num_pollers < 1){
  console.error('usage : node master_poll.js $num_pollers');
  console.error('$num_pollers : int (must be or equal to or less than the number of cores on this machine)');
  console.error('# cores :', num_cores);
  process.exit();
}

function getUserChunks(cb){
  var num_chunks = num_pollers;
  var chunks = [];
  dao.getUserSet(function(e, users){
    var max_chunk_size = Math.ceil(users.length/num_chunks);
    console.log(max_chunk_size);
    if (users.length===0) return;
    while (users.length){
        chunks.push(users.splice(0, max_chunk_size));
    }
    cb(null, chunks);
  });
}

function restart(){
  console.log('restarting');
  killKids(); 
  start();
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

function initKid(chunk, rank){
  var kid = spawn('node', ['poll.js', chunk]);
  var pid = kid.pid;
  var prefix = getPrefix(rank);
  
  kid.stdout.setEncoding('utf8');
  kid.stderr.setEncoding('utf8');

  kid.stdout.on('data', function(data){
    sys.puts(prefix+' '+pid+": "+data);
    if (data=='poll:completed'){
      NUM_COMPLETED +=1;
      if (NUM_COMPLETED===kids.length){
        NUM_COMPLETED=0;
        restart();
      }    
    }
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
  if (!chunks.length){
    return;
  }
  initKid(chunks.shift(), chunks.length);
  setTimeout(function(){
    initKids(chunks);
  }, 1000);
}

process.on('SIGTERM', function(){
  console.error('Terminating Kids');
  killKids();
  process.exit();
});

function start(){
  getUserChunks(function(e, chunks){
    initKids(chunks);
  });
}

start();
setInterval(function(){
  restart();
}, 10000);
