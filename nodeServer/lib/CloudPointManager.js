var fs = require('fs');
var path = require('path');

function CPMRelay( io, cpfile) {
  var cpManager = io
    // only listen on the fps namespace
    .of('/manager')

    .on('connection', function (socket) {
	socket.on('refresh', function () {
        	socket.emit('refresh');
    		socket.broadcast.emit('refresh');
	});
	socket.on('changeData', function (data) { 
    		console.log("Changing Point Cloud Data: ", data); 
		cpfile = data;
    		socket.emit('refresh');
    		socket.broadcast.emit('refresh');
    		
    	});
	socket.on('getCPDirs', function(){
		var srcpath = path.resolve(path.dirname(require.main.filename), '../public/lg-potree/resources/pointclouds');
		socket.emit("error", srcpath);
		try{
			items = fs.readdirSync(srcpath).filter(function(file) {
			    return fs.statSync(path.join(srcpath, file)).isDirectory();
			  });
			socket.emit('CPDir', items);
		} catch (e) {
			if (e.code === 'ENOENT') {
				console.log("Directory not found!");
				socket.emit("error", "Directory not found");
			}else{
				console.log("Found error:", e);
				socket.emit("error", e);
			}
		}

	});
      socket.on('getJSONfile', function(){
        socket.emit('sendJSONfile', cpfile);
      });
    });

  return {
    io: cpManager
  }
};




module.exports.relay = CPMRelay;

