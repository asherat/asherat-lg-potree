<?php

?>
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="style.css" />
		<script type="text/javascript" src="javascript.js"></script> 
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
		<title>Cloud Point Viewer for Liquid Galaxy</title>
	</head>
	<nav>
		<ul>
			<h1>Cloud Point Viewer for Liquid Galaxy</h1>
			<li>
				<h5>Please, fill in the IP and ports BEFORE initializing the Node.js server or connecting the SpaceNavigator</h5>
				<label for="myIP"> IP </label>
				<input type="text"  id = "myIP" value="10.42.42.1">
				<label for="myPORT"> Port </label>
				<input type="text"  id = "myPORT" value="8086">

			</li>
			<li><a href="#" onclick="initPeruse()">Initialize LG-Potree </a></li>

			<li><a href="#" onclick="RefreshBrowsers()">Refresh Browsers</a></li>
			<li><a href="#" onclick="openManager()">Cloud Point Manager</a></li>
			<br>
			<br>
			<li><a rel="external" href="https://github.com/LiquidGalaxyLAB/asherat666-lg-potree/wiki">LG-Potree Wiki</a></li>
			<li><a href="#" onclick="stopAll()">Close LG-Potree</a></li>
			<li><a id="back" href="index.php">Go Back</a></li>
		</ul>
	</nav>
	<body>
		<div class="touchscreen">
			<div id="status"></div>
		</div>
	</body>
</html>
