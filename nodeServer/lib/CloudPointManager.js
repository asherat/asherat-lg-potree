var fs = require('fs');
var path = require('path');

function CPMRelay( io, cpfile) {
  var cpManager = io
    .of('/manager')
    .on('connection', function (socket) {
	socket.on('refresh', function () {
        	socket.emit('refresh');
    		socket.broadcast.emit('refresh');
	});
	socket.on('changeData', function (data) { 
    		console.log("Changing Point Cloud Data: ", data); 
		cpfile = data;
    		//socket.emit('refresh');
    		socket.broadcast.emit('refresh');
    		
    	});
	socket.on('getCPDirs', function(){
		var srcpath = path.resolve(path.dirname(require.main.filename), '../public/lg-potree/resources/pointclouds');
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
	//Manager wants the Args status from master
	socket.on('getArgsStatus', function(){
		socket.broadcast.emit('queryArgs');
	});
	//Master sends the Args status
	socket.on('queryArgs', function(data){
		socket.broadcast.emit('getArgsStatus', data);
	});
	socket.on('queryArgs2', function(data){
		socket.broadcast.emit('getArgsStatus2', data);
	});

	//The manager sends new Args
	socket.on('newArgs', function(data){
		socket.broadcast.emit('updateArgs', data);
	});

    });

  return {
    io: cpManager
  }
};




module.exports.relay = CPMRelay;



