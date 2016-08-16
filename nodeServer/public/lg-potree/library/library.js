// Create SocketIO instance, connect
var CPManager = io.connect('/manager');

// Add a connect listener
CPManager.on('connect',function() {
	console.debug('Manager Module Loaded');
});

// Add a disconnect listener
CPManager.on('disconnect',function() {
	console.debug('Manager Module has disconnected!');
});

// Gets the available Point Cloud list and displays it on the browser
CPManager.on( 'CPDir', function( data ) {
	if (!data) return;
	// Sort the data received regardless of capitalization
	data = data.sort(function (a,b){
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});
	
	var content = $( "#cpFiles" ).html();
	// Add the photo, name and link to every Point Cloud Data
	// If no photo is found, it gets the default logo_black via "this.onerror" function
	for (i = 0; i < data.length; i++) { 
		var newMsgContent =
		'<li>' +
			'<div id="pc" ' +
				'onclick="sendMessageToServer(\'' + data[i] + '\')" >' +
				'<img class="gallery" src="../resources/pointclouds/' + data[i] + '/preview.png"' +
				'onerror="this.onerror=null;this.src=\'../resources/images/logo_black.png\';" ' +
				' />' +
				'<h3>' + data[i] + '</h3>' +
			'</div>' +
		'</li>';
		content = content + newMsgContent; 

	}
	$( "#cpFiles" ).html( content );
});

CPManager.on( 'error', function( err ) {
	console.error("FOUND ERROR", err);
});

// Gets the variable status from the Potree master
CPManager.on('getArgsStatus', function( data ){
		changeArgs = data;
		waiting1 = false;
	});
	
// Gets the available variable list from the Potree master
CPManager.on('getArgsStatus2', function( data ){
	
		guiArgs = data;
		waiting2 = false;
	});
	
	
var changeArgs = {
	// Variables that can be set using the GUI
	rotation: null,
	position: null,
	"points": 1,
	"pointSize": 1.2,
	"FOV": 30,
	"opacity": 1,
	"sizeType" : 0,
	"material" : 0,
	"quality": "Squares",
	"EDL": false,
	"flipYZ": true,
	"skybox": false,
	"sponsors": true,

	"ClipMode": "Highlight Inside",
	"DEMCollisions": false,
	"MinNodeSize": 100,

	"stats": false, 
	"BoundingBox": false,
	"freeze": false,

	"sSizeType": "Adaptive",
	"sMaterial": "RGB",
	
};

var guiArgs = {
	// These are the variable list, and are filled by the available Potree options
	options : [ "RGB" ],
	qualityOptions : [ "Squares", "Circles" ],
	isEDLenabled : false,
}


// Alert the server that the new "data" has to be displayed
function sendMessageToServer(data) {
	CPManager.emit('changeData',data);
};

function sendArgs(){
	CPManager.emit('newArgs', changeArgs);
}

function RefreshBrowsers(){
	CPManager.emit('refresh');
}


// We want to wait for the Potree master node
// the available variable list and the current variable status
// It checks every 500ms for the variables, if they are not received
// it won't load the GUI
var waiting1 = true;
var waiting2 = true;
function waitArgs() {
    if(waiting1 || waiting2) {
        setTimeout(waitArgs, 500);
        return;
    }
	initGUI(changeArgs, guiArgs);
}


$(document).ready(function() {
	// Queries the available Point Cloud data
	CPManager.emit('getCPDirs');
	// Queries the available variable list and variables status
	CPManager.emit('getArgsStatus');
	waitArgs();
});	


function initGUI(args, guiArgs){
		gui = new dat.GUI({ width: 400	});
	
		params = {
			"points(m)": args.points,
			"PointSize": args.pointSize,
			"FOV": args.FOV,
			"opacity": args.opacity,
			"SizeType" : args.sSizeType,
			"Materials" : args.sMaterial,
			"quality": args.quality,
			"EDL": args.EDL,
			"FlipYZ": args.flipYZ,
			"skybox": args.skybox,
			"sponsors": args.sponsors,

			"Clip Mode": args.ClipMode,
			"DEM Collisions": args.DEMCollisions,
			"MinNodeSize": args.MinNodeSize,

			"stats": args.stats,
			"BoundingBox": args.BoundingBox,
			"freeze": args.freeze
			
		};


		var fAppearance = gui.addFolder('Appearance');
		
		pPoints = fAppearance.add(params, 'points(m)', 0, 4);
		pPoints.onChange(function(value){
			changeArgs.points = value;
			sendArgs();
		});

		pPointSize = fAppearance.add(params, 'PointSize', 0, 3);
		pPointSize.onChange(function(value){
			changeArgs.pointSize = value;
			sendArgs();
		});
		
		pFOV = fAppearance.add(params, 'FOV', 20, 100);
		pFOV.onChange(function(value){
			changeArgs.FOV = value;
			sendArgs();
		});
		
		pOpacity = fAppearance.add(params, 'opacity', 0, 1);
		pOpacity.onChange(function(value){
			changeArgs.opacity = value;
			sendArgs();
		});
		
		pSizeType = fAppearance.add(params, 'SizeType', [ "Fixed", "Attenuated", "Adaptive"]);
		pSizeType.onChange(function(value){
			changeArgs.sSizeType = value;
			sendArgs();
		});
			
		pMaterial = fAppearance.add(params, 'Materials', guiArgs.options);
		pMaterial.onChange(function(value){
			changeArgs.sMaterial = value;
			sendArgs();
		});
		
		pQuality = fAppearance.add(params, 'quality', guiArgs.qualityOptions);
		pQuality.onChange(function(value){
			changeArgs.quality = value;
			sendArgs();
		});

		if(guiArgs.isEDLenabled){
			pEDL = fAppearance.add(params, 'EDL');
			pEDL.onChange(function(value){
				changeArgs.EDL = value;
				sendArgs();
			});
		}


		pFlipYZ = fAppearance.add(params, 'FlipYZ');
		pFlipYZ.onChange(function(value){
			changeArgs.flipYZ = value;
			sendArgs();
		});

		pSkybox = fAppearance.add(params, 'skybox');
		pSkybox.onChange(function(value){
			changeArgs.skybox = value;
			sendArgs();
		});
		
		pSponsors = fAppearance.add(params, 'sponsors');
		pSponsors.onChange(function(value){
			changeArgs.sponsors = value;
			sendArgs();
		});


		var fSettings = gui.addFolder('Settings');
		
		pClipMode = fSettings.add(params, 'Clip Mode', [ "No Clipping", "Clip Outside", "Highlight Inside"]);
		pClipMode.onChange(function(value){
			changeArgs.ClipMode = value;
			sendArgs();
		});
		

		pDEMCollisions = fSettings.add(params, 'DEM Collisions');
		pDEMCollisions.onChange(function(value){
			changeArgs.DEMCollisions = value;
			sendArgs();
		});
		
		pMinNodeSize = fSettings.add(params, 'MinNodeSize', 0, 1500);
		pMinNodeSize.onChange(function(value){
			changeArgs.MinNodeSize = value;
			sendArgs();
		});
		
		
		
		fDebug = gui.addFolder('Debug');

		
		pStats = fDebug.add(params, 'stats');
		pStats.onChange(function(value){
			changeArgs.stats = value;
			sendArgs();
		});
		
		pBoundingBox = fDebug.add(params, 'BoundingBox');
		pBoundingBox.onChange(function(value){
			changeArgs.BoundingBox = value;
			sendArgs();
		});
		
		pFreeze = fDebug.add(params, 'freeze');
		pFreeze.onChange(function(value){
			changeArgs.freeze = value;
			sendArgs();
		});
	

}
