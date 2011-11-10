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
    users = num_users ? users.splice(0, num_users) : users;
    var max_chunk_size = Math.round(users.length/num_chunks);
    if (users.length===0) return;
    while (users.length > max_chunk_size){
        chunks.push(users.splice(0, max_chunk_size));
    }
    chunks.push(users);
    cb(null, chunks);
  });
}

function restart(){
  console.log('restarting');
  killKids(); 
  initKids(num_pollers);
}

function killKids(){
  console.log('killing', kids.length, 'kids');
  kids.forEach(function(kid){
    kid.kill();
  });
}

function initKids() {
  getUserChunks(function(e, chunks){
    chunks.forEach(function(chunk){
      var kid = spawn('node', ['poll.js', chunk]);
      kid.stdout.setEncoding('utf8');
      kid.stderr.setEncoding('utf8');

      kid.stdout.on('data', function(data){
        sys.puts(kid.pid, data);
        if (data=='poll:completed'){
          restart();
        }
      });

      kid.stderr.on('data', function(data){
        sys.puts(kid.pid, 'error:', data);
      });

      kid.on('exit', function(code){
        if (code !== 0){
          sys.puts('kid', kid.pid, 'died, with code', code);
        }
      });

      kids.push(kid);
    });
  });
}


process.on('SIGTERM', function(){
  console.error('Terminating Kids');
  killKids();
  process.exit();
});

initKids();
