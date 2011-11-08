var os = require('os');
var num_pollers = (process.argv[2]/1);
var num_cores = os.cpus().length;
var dao = require('redis-daos').build('facebook-poller');
var spawn = require('child_process').spawn;
var sys = require('sys');

if (!num_pollers || num_pollers > num_cores || num_pollers < 1){
  console.error('usage : node master_poll.js $num_pollers');
  console.error('$num_pollers : int (must be or equal to or less than the number of cores on this machine)');
  console.error('# cores :', num_cores);
  process.exit();
}

function getUserChunks(num_chunks, cb){
  var chunks = [];
  dao.getUserSet(function(e, users){
    var max_chunk_size = Math.round(users.length/num_chunks);
    if (users.length===0) return;
    while (users.length > max_chunk_size){
        chunks.push(users.splice(0, max_chunk_size));
    }
    chunks.push(users);
    cb(null, chunks);
  });
}

var kids = [];

getUserChunks(num_pollers, function(e, chunks){
  chunks.forEach(function(chunk){
    var kid = spawn('node', ['poll_users.js', chunk]);
    kid.stdout.setEncoding('utf8');
    kid.stderr.setEncoding('utf8');

    kid.stdout.on('data', function(data){
      sys.puts(kid.pid, data);
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
