<?php

?>
<html>
	<head>
		<link rel="stylesheet" type="text/css" href="style.css" />
		<script type="text/javascript" src="javascript.js"></script> 
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
		<title>LG-Potree Manager</title>
	</head>
	<nav>
		<ul>
			<h1>LG-Potree Manager</h1>
			<li><a href="#" onclick="#">Select Cloud Point</a></li>
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
