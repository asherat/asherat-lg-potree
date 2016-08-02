

// Create SocketIO instance, connect
var socket = io.connect('/manager');

// Add a connect listener
socket.on('connect',function() {
	console.log('Client has connected to the server!');
});

// Add a disconnect listener
socket.on('disconnect',function() {
	console.log('The client has disconnected!');
});

socket.on( 'CPDir', function( data ) {
	console.debug("RECEIVED:", data);
	if (!data) return;
	data = data.sort();
	var content = $( "#cpFiles" ).html();
	for (i = 0; i < data.length; i++) { 
		var newMsgContent = '<li><img src="../resources/pointclouds/' + data[i] + '/preview.png"' +
		'onerror="this.onerror=null;this.src=\'../resources/images/logo.png\';" ' +
		'onclick="sendMessageToServer(\'' + data[i] + '\')" />' +
		'<h3>'+ data[i] +'</h3></li>';

		content = content + newMsgContent; 

	}
	$( "#cpFiles" ).html( content );
});
socket.on( 'error', function( err ) {
	console.error("FOUND ERROR", err);
});

$(document).ready(function() {
	socket.emit('getCPDirs');
});		    


// Sends a message to the server via sockets
function sendMessageToServer(message) {
	socket.emit('changeData',message);
};


function RefreshBrowsers(){
	console.log("REFRESHING");
socket.emit('refresh');
}
