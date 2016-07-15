
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="style.css" />
		<script type="text/javascript" src="javascript.js"></script> 
		<script src="https://code.jquery.com/jquery-1.10.2.min.js"></script>
		<script src="socket.io.min.js"></script>
		<title>LG-Potree Manager</title>
		<script>

		    // Create SocketIO instance, connect
		    var socket = io.connect('http://localhost:8086/manager');

		    // Add a connect listener
		    socket.on('connect',function() {
		      console.log('Client has connected to the server!');
		    });

		    // Add a disconnect listener
		    socket.on('disconnect',function() {
		      console.log('The client has disconnected!');
		    });

		    // Sends a message to the server via sockets
		    function sendMessageToServer(message) {
		      //socket.send(message);
		      socket.emit('changeData',message);
		    };
		</script>
	</head>
	<nav>
		<ul>
			<h1>LG-Potree Manager</h1>
			<li><a href="#" onclick="sendMessageToServer('lion_takanawa')">Select Cloud Point 1</a></li>
			<li><a href="#" onclick="sendMessageToServer('vol_total')">Select Cloud Point 2</a></li>
			<li><a href="#" onclick="RefreshBrowsers();">Refresh Browsers</a></li>
			<br>
			<br>
			<li><a href="#" onclick="stopAll();">Close Potree</a></li>
			<li><a rel="external" href="https://github.com/LiquidGalaxyLAB/asherat666-lg-potree/wiki">LG-Potree Wiki</a></li>
			<li><a id="back" href="peruse.php">Go Back</a></li>
		</ul>
	</nav>
	<body>
		<div class="touchscreen">
			<div id="status"></div>
		</div>
	</body>
</html>

