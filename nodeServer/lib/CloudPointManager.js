var fs = require('fs');
function CPMRelay( io, cpfile) {
  var cpManager = io
    // only listen on the fps namespace
    .of('/manager')

    .on('connection', function (socket) {
      socket.on('refresh', function () {
        refresh( socket );
      });
    	socket.on('changeData', function (data) { 
    		console.log("Changing CloudPoint File: ", data); 
		    cpfile = data;
    		socket.emit('changeCPData',{message:data});
    		socket.broadcast.emit('changeCPData',{message:data});
    		
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

