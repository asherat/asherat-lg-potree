var fs = require('fs');

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
		fs.readdir('public/lg-potree/resources/pointclouds', function(err, items){
			socket.emit('CPDir',items);
		});
		
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

