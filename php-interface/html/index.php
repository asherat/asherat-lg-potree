<?php

?>
<html>
	<head>
		<link rel="icon" type="image/png" href="icon.png" />
		<link rel="stylesheet" type="text/css" href="style.css" />
		<script type="text/javascript" src="javascript.js"></script> 
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
		<title>Point Cloud Viewer for Liquid Galaxy</title>
	</head>
	<nav>
		<ul>
			<h1>Point Cloud Viewer for Liquid Galaxy</h1>
			<li>
				<h5>Please, fill in the IP and ports BEFORE initializing the Node.js server or connecting the SpaceNavigator</h5>
				<label for="lgIP"> Liquid Galaxy IP </label>
				<input type="text"  id = "lgIP" value="<?php echo implode(".", array_slice(explode(".", $_SERVER["SERVER_ADDR"]), 0, 3)).'.';  ?>" >
			</li>
			<li>
				<label for="nodeIP" > NodeJS IP </label>
				<input type="text" id ="nodeIP" value="<?php echo $_SERVER["SERVER_ADDR"] ?> " disabled>
				<label for="nodePort"> Port </label>
				<input type="text"  id = "nodePort" value="8086">
			</li>


			<li><a href="#" onclick="initPeruse()">Initialize LG-Potree </a></li>
			<li><a href="#" onclick="openManager()">Point Cloud Manager</a></li>
			<br>
			<li><a href="#" onclick="openLibrary()">Point Cloud Library</a></li>
			<br>
			<li><a href="#" onclick="FullscreenBrowsers()">Fullscreen Browsers</a></li>
			<li><a href="#" onclick="RefreshBrowsers()">Refresh Browsers</a></li>
			<br>
			<li><a rel="external" href="https://github.com/LiquidGalaxyLAB/asherat666-lg-potree/wiki">LG-Potree Wiki</a></li>
			<li><a href="#" onclick="stopAll()">Close LG-Potree</a></li>


		</ul>
		<ul>
			<h1>Tools</h1>
			<li><a href="#" onclick="toolRequest('relaunch');">Relaunch</a></li>
			<li><a href="#" onclick="toolRequest('reboot');">Reboot</a></li>
			<li><a href="#" onclick="toolRequest('shutdown');">Shutdown</a></li>

		</ul>
	</nav>
	<body>
		<div class="touchscreen">
			<div id="status"></div>
		</div>
	</body>
</html>
