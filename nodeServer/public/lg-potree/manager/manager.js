

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

CPManager.on( 'CPDir', function( data ) {
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

CPManager.on( 'error', function( err ) {
	console.error("FOUND ERROR", err);
});

CPManager.on('getArgsStatus', function( data ){
		changeArgs = data;
		waiting1 = false;
	});
CPManager.on('getArgsStatus2', function( data ){
	
		guiArgs = data;
		waiting2 = false;
	});
// Sends a message to the server via sockets
function sendMessageToServer(message) {
	CPManager.emit('changeData',message);
};


function RefreshBrowsers(){
	CPManager.emit('refresh');
}




var changeArgs  = { 
	rotation: null,
	position: null,
	"points": 1,
	"pointSize": 1.2,
	"FOV": 30,
	"opacity": 1,
	"sizeType" : "Adaptive",
	"material" : "RGB",
	"quality": "Squares",
	"EDL": false,
	"flipYZ": true,
	"skybox": false,
	"sponsors": true, //new

	"ClipMode": "Highlight Inside", //new
	"DEMCollisions": false, //new
	"MinNodeSize": 100,

	"stats": false, 
	"BoundingBox": false,
	"freeze": false,

};

var guiArgs = {
	options : [ "RGB" ],
	qualityOptions : [ "Squares", "Circles" ],
	isEDLenabled : false,
}

var waiting1 = true;
var waiting2 = true;

function waitArgs() {
    if(waiting1 || waiting2) {//we want it to match
        setTimeout(waitArgs, 50);//wait 50 millisecnds then recheck
        return;
    }
	initGUI(changeArgs, guiArgs);
}






$(document).ready(function() {
	CPManager.emit('getCPDirs');
	CPManager.emit('getArgsStatus');
	waitArgs();
	

});	


function loadArgs(data){
	//Appearance
	pPoints.setValue(data.points);
	pPointSize.setValue(data.pointSize);
	pFOV.setValue(data.FOV);
	pOpacity.setValue(data.opacity);
	pSizeType.setValue(data.sizeType);
	pMaterial.setValue(data.material);
	pQuality.setValue(data.quality);
	if(pEDL !== undefined)
		pEDL.setValue(data.EDL);
	pFlipYZ.setValue(data.flipYZ);
	pSkybox.setValue(data.skybox);
	pSponsors.setValue(data.sponsors);

	//Settings
	pClipMode.setValue(data.clipMode);
	pDEMCollisions.setValue(data.useDEMCollisions);
	pMinNodeSize.setValue(data.MinNodeSize);


	//Debug
	pStats.setValue(data.stats);
	pBoundingBox.setValue(data.BoundingBox);
	pFreeze.setValue(data.freeze);
}

function sendArgs(){
	CPManager.emit('newArgs', changeArgs);
}

function initGUI(args, guiArgs){
		gui = new dat.GUI({	});
	
		params = {
			"points(m)": args.points,
			"PointSize": args.pointSize,
			"FOV": args.FOV,
			"opacity": args.opacity,
			"SizeType" : args.sizeType,
			"Materials" : args.material,
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
			changeArgs.sizeType = value;
			sendArgs();
		});
			
		//options = [ "RGB", "Color", "Elevation", "Intensity", "Intensity Gradient", 
		//"Classification", "Return Number", "Source",
		//"Tree Depth"]; // GET
		pMaterial = fAppearance.add(params, 'Materials', guiArgs.options);
		pMaterial.onChange(function(value){
			changeArgs.material = value;
			sendArgs();
		});
		
		//qualityOptions = ["Squares", "Circles", "Interpolation"]; //GET
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
			changeArgs.clipMode = value;
			sendArgs();
		});
		
		pDEMCollisions = fSettings.add(params, 'DEM Collisions');
		pDEMCollisions.onChange(function(value){
			changeArgs.useDEMCollisions = value;
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
