var CPManager = io.connect('/manager');

// Add a connect listener
CPManager.on('connect', function () {
	CPManager.emit('getJSONfile');
});

// Refreshes the web browsers
CPManager.on('refresh', function () {
	console.log("REFRESH");
	window.location.reload(true);
});

// Add a disconnect listener
CPManager.on('disconnect', function () {
	console.log('The client has disconnected!');
});

// This is received when the Library connects, querying for the existing Potree options
CPManager.on('queryArgs', function () {
	CPManager.emit('queryArgs', changeArgs);
	CPManager.emit('queryArgs2', guiArgs);
});

// Update Potree options when the Library tells to
CPManager.on('updateArgs', function (data) {
	//Appearance
	pPoints.setValue(data.points);
	pPointSize.setValue(data.pointSize);
	pFOV.setValue(data.FOV);
	pOpacity.setValue(data.opacity);
	pSizeType.setValue(data.sSizeType);
	pMaterial.setValue(data.sMaterial);
	pQuality.setValue(data.quality);
	if (pEDL !== undefined)
		pEDL.setValue(data.EDL);
	pFlipYZ.setValue(data.flipYZ);
	pSkybox.setValue(data.skybox);
	pSponsors.setValue(data.sponsors);

	//Settings
	pClipMode.setValue(data.ClipMode);
	pDEMCollisions.setValue(data.DEMCollisions);
	pMinNodeSize.setValue(data.MinNodeSize);

	//Debug
	pStats.setValue(data.stats);
	pBoundingBox.setValue(data.BoundingBox);
	pFreeze.setValue(data.freeze);
});

////////////////// GUI //////////////////
var gui;
var elRenderArea = document.getElementById("renderArea");
var progressBar = new ProgressBar();
var showGrid = false;
var skybox;
var stats;

// Configure as needed, or take the parameters from sceneProperties (index.html)
//    APPEARANCE GUI FOLDER
var pointCountTarget = sceneProperties.pointLimit;
var pointSize = sceneProperties.pointSize;
var fov = sceneProperties.fov;
var opacity = 1;
var pointSizeType = setPointSizeType(sceneProperties.sizeType);
var sSizeType = sceneProperties.sizeType; // SizeType String
var pointColorType = setMaterial(sceneProperties.material);
var sMaterial = sceneProperties.material; // Material String
var quality = setQuality(sceneProperties.quality);
var useEDL = setEDL(sceneProperties.useEDL);
var isFlipYZ = false;
var showSkybox = false;
var sponsors = true;


//    SETTINGS GUI FOLDER
var clipMode = Potree.ClipMode.HIGHLIGHT_INSIDE;
var useDEMCollisions = false;
var minNodeSize = 100;

//    DEBUG GUI FOLDER
var showStats = false;
var showBoundingBox = false;
var freeze = false;
//////////////END OF GUI //////////////////

// RENDERING
var renderer;
var camera, scene;
var scenePointCloud;
var sceneBG, cameraBG;
var referenceFrame;
var pointcloud;
var directionalLight;


var controls;
var snControls;

var clock = new THREE.Clock();

function setPointSizeType(value) {
	if (value === "Fixed") {
		return Potree.PointSizeType.FIXED;
	} else if (value === "Attenuated") {
		return Potree.PointSizeType.ATTENUATED;
	} else if (value === "Adaptive") {
		return Potree.PointSizeType.ADAPTIVE;
	}
}

function setMaterial(value) {
	if (value === "RGB") {
		return Potree.PointColorType.RGB;
	} else if (value === "Color") {
		return Potree.PointColorType.COLOR;
	} else if (value === "Elevation") {
		return Potree.PointColorType.HEIGHT;
	} else if (value === "Intensity") {
		return Potree.PointColorType.INTENSITY;
	} else if (value === "Intensity Gradient") {
		return Potree.PointColorType.INTENSITY_GRADIENT;
	} else if (value === "Classification") {
		return Potree.PointColorType.CLASSIFICATION;
	} else if (value === "Return Number") {
		return Potree.PointColorType.RETURN_NUMBER;
	} else if (value === "Source") {
		return Potree.PointColorType.SOURCE;
	} else if (value === "Tree Depth") {
		return Potree.PointColorType.TREE_DEPTH;
	} else if (value === "Point Index") {
		return Potree.PointColorType.POINT_INDEX;
	} else if (value === "Normal") {
		return Potree.PointColorType.NORMAL;
	} else if (value === "Phong") {
		return Potree.PointColorType.PHONG;
	} else
		return Potree.PointColorType.RGB;
}

function setQuality(value) {
	if (value == "Interpolation" && !Potree.Features.SHADER_INTERPOLATION.isSupported()) {
		return "Squares";
	} else if (value == "Splats" && !Potree.Features.SHADER_SPLATS.isSupported()) {
		return "Squares";
	} else {
		return (quality === null) ? "Squares" : value;
	}
}

function setEDL(value){
	if(!Potree.Features.SHADER_EDL.isSupported())
		return false;
	else
		return value;
}

function setClipMode(value) {
	if (value === "No Clipping") {
		return Potree.ClipMode.DISABLED;
	} else if (value === "Clip Outside") {
		return Potree.ClipMode.CLIP_OUTSIDE;
	} else if (value === "Highlight Inside") {
		return Potree.ClipMode.HIGHLIGHT_INSIDE;
	}
}


var changeArgs = {
	// Variables that are sent to the slaves
	rotation : null,
	position : null,
	"points" : pointCountTarget,
	"pointSize" : pointSize,
	"FOV" : fov,
	"opacity" : opacity,
	"sizeType" : pointSizeType,
	"material" : pointColorType,
	"quality" : quality,
	"EDL" : useEDL,
	"flipYZ" : isFlipYZ,
	"skybox" : showSkybox,
	"sponsors" : true,

	"ClipMode" : "Highlight Inside",
	"DEMCollisions" : useDEMCollisions,
	"MinNodeSize" : minNodeSize,

	"stats" : showStats,
	"BoundingBox" : showBoundingBox,
	"freeze" : freeze,
	
	"sMaterial" : sMaterial,
	"sSizeType" : sSizeType,

};

var lastChangeArgs = {
	rotation : null,
	position : null,

};

var guiArgs = {
	// These variables will have the different options available in Potree
	// Them will be sent in order to fill the options in the Library page
	options : ["RGB"],
	qualityOptions : ["Squares", "Circles"],
	isEDLenabled : false,
}

// Function that is executed only by the master
// "changeArgs" is the "a" array at preRenderSlave function
// "changeArgs" will store all the variables that the slaves need to update when the master does too
var preRenderMaster = function () {
	// Send a packet to the slave if:
	//  * We've just initialized  -- or --
	//  * Something has changed on the GUI -- or --
	//  * Something has changed in the target or the position
	// Unless changeArgs.position is null

	if (changeArgs.position !== null && (THREELG.justInitialized || guiChanged ||
			(lastChangeArgs.position != null && Math.abs(changeArgs.position.distanceTo(lastChangeArgs.position)) > 1e-10)
			 || (lastChangeArgs.rotation != null && changeArgs.rotation != lastChangeArgs.rotation))) {
		delete changeArgs.skipSlaveRender;
		guiChanged = false;
		THREELG.justInitialized = false;
	} else {
		changeArgs.skipSlaveRender = 1;
	}

	if (changeArgs.position !== null) {
		lastChangeArgs.position = changeArgs.position;
	}
	if (changeArgs.rotation !== null) {
		lastChangeArgs.rotation = changeArgs.rotation;
	}

	if (changeArgs.skipSlaveRender === undefined) {
		CPManager.emit('masterArgs', "ALGO");
	}

	return changeArgs;
};

// Function that all the slaves will execute
// "a" is an array sent by preRenderMaster
// Take also a look at three-lg.js
var preRenderSlave = function (a) {
	var yawOffset;
	var oParametre = {};

	if (window.location.search.length > 1) {
		for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
			aItKey = aCouples[nKeyId].split("=");
			oParametre[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
		}
	}
	if (oParametre.yawOffset)
		yawOffset = oParametre.yawOffset;
	else
		yawOffset = 1;

	//console.log(JSON.stringify(a)); //DEBUG
	camera.position.copy(a.position);
	camera.rotation.copy(a.rotation)
	camera.rotateOnAxis((new THREE.Vector3(0, -1, 0)), yawOffset * rotationAngle * Math.PI / 180);

	// Slaves update variables sent by the master
	if (pointcloud !== undefined) {
		pointCountTarget = a.points;
		pointcloud.visiblePointsTarget = pointCountTarget * 1000 * 1000;

		pointSize = a.pointSize;
		pointcloud.material.size = pointSize;

		fov = a.FOV;

		opacity = a.opacity;

		pointSizeType = a.sizeType;
		pointcloud.material.pointSizeType = pointSizeType;

		pointColorType = a.material;
		pointcloud.material.pointColorType = pointColorType;

		quality = a.quality;
		pointcloud.material.pointShape = (quality === "Circles") ? Potree.PointShape.CIRCLE : Potree.PointShape.SQUARE;
		pointcloud.material.interpolate = (quality === "Interpolation");

		useEDL = a.EDL;

		showSkybox = a.skybox;

		sponsors = a.sponsors;

		clipPmode = a.ClipMode;
		useDEMCollisions = a.DEMCollisions;
		minNodeSize = a.MinNodeSize;

		showStats = a.stats;
		if (stats === undefined) {
			stats = new Stats();
			document.getElementById("logo").appendChild(stats.domElement);
		}
		if (stats && showStats) {
			document.getElementById("lblNumVisibleNodes").style.display = "";
			document.getElementById("lblNumVisiblePoints").style.display = "";
			stats.domElement.style.display = "";

			stats.update();

			if (pointcloud) {
				document.getElementById("lblNumVisibleNodes").innerHTML = "visible nodes: " + pointcloud.numVisibleNodes;
				document.getElementById("lblNumVisiblePoints").innerHTML = "visible points: " + Potree.utils.addCommas(pointcloud.numVisiblePoints);
			}
		} else if (stats) {
			document.getElementById("lblNumVisibleNodes").style.display = "none";
			document.getElementById("lblNumVisiblePoints").style.display = "none";
			stats.domElement.style.display = "none";
		}

		showBoundingBox = a.BoundingBox;
		pointcloud.showBoundingBox = showBoundingBox;

		freeze = a.freeze;
		
		if (a.flipYZ != isFlipYZ) {
			flipYZ();
		}

	}
};

var changeEvent = function (event) {
	changeArgs.rotation = event.target.object.rotation.clone();
	changeArgs.position = event.target.object.position.clone();
}

var guiChanged = false;

function initGUI() {

				flipYZ();
				
	gui = new dat.GUI({});

	params = {
		"points(m)" : changeArgs.points,
		"PointSize" : changeArgs.pointSize,
		"FOV" : changeArgs.FOV,
		"opacity" : changeArgs.opacity,
		"SizeType" : sSizeType,
		"Materials" : sMaterial,
		"quality" : changeArgs.quality,
		"EDL" : changeArgs.EDL,
		"FlipYZ" : changeArgs.flipYZ,
		"skybox" : changeArgs.skybox,
		"sponsors" : changeArgs.sponsors,

		"Clip Mode" : changeArgs.ClipMode,
		"DEM Collisions" : changeArgs.DEMCollisions,
		"MinNodeSize" : changeArgs.MinNodeSize,

		"stats" : changeArgs.stats,
		"BoundingBox" : changeArgs.BoundingBox,
		"freeze" : changeArgs.freeze

	};

	// APPEARANCE GUI FOLDER
	var fAppearance = gui.addFolder('Appearance');

	pPoints = fAppearance.add(params, 'points(m)', 0, 4);
	pPoints.onChange(function (value) {
		pointCountTarget = value;
		changeArgs.points = value;
		guiChanged = true;
	});

	pPointSize = fAppearance.add(params, 'PointSize', 0, 3);
	pPointSize.onChange(function (value) {
		pointSize = value;
		changeArgs.pointSize = value;
		guiChanged = true;
	});

	pFOV = fAppearance.add(params, 'FOV', 20, 100);
	pFOV.onChange(function (value) {
		fov = value;
		changeArgs.FOV = value;
		guiChanged = true;

	});

	pOpacity = fAppearance.add(params, 'opacity', 0, 1);
	pOpacity.onChange(function (value) {
		opacity = value;
		changeArgs.opacity = value;
		guiChanged = true;
	});

	pSizeType = fAppearance.add(params, 'SizeType', ["Fixed", "Attenuated", "Adaptive"]);
	pSizeType.onChange(function (value) {
		changeArgs.sSizeType = value;
		pointSizeType = setPointSizeType(value);
		changeArgs.sizeType = pointSizeType;
		guiChanged = true;
	});

	options = [];
	var attributes = pointcloud.pcoGeometry.pointAttributes;
	if (attributes === "LAS" || attributes === "LAZ") {
		options = [
			"RGB", "Color", "Elevation", "Intensity", "Intensity Gradient",
			"Classification", "Return Number", "Source",
			"Tree Depth"];
	} else {
		for (var i = 0; i < attributes.attributes.length; i++) {
			var attribute = attributes.attributes[i];
			if (attribute === Potree.PointAttribute.COLOR_PACKED) {
				options.push("RGB");
			} else if (attribute === Potree.PointAttribute.INTENSITY) {
				options.push("Intensity");
				options.push("Intensity Gradient");
			} else if (attribute === Potree.PointAttribute.CLASSIFICATION) {
				options.push("Classification");
			}
		}
		if (attributes.hasNormals()) {
			options.push("Phong");
			options.push("Normal");
		}

		options.push("Elevation");
		options.push("Color");
		options.push("Tree Depth");
	}
	// default material is not available. set material to RGB
	if (options.indexOf(params.Materials) < 0) {
		console.error("Default Material '" + params.Materials + "' is not available. Using RGB instead");
		pointColorType = setMaterial("RGB");
		params.Materials = "RGB";
	}
	guiArgs.options = options;
	pMaterial = fAppearance.add(params, 'Materials', options);
	pMaterial.onChange(function (value) {
		changeArgs.sMaterial = value;
		pointColorType = setMaterial(value);
		changeArgs.material = pointColorType;
		guiChanged = true;
	});

	qualityOptions = ["Squares", "Circles"];
	if (Potree.Features.SHADER_INTERPOLATION.isSupported()) {
		qualityOptions.push("Interpolation");
	}
	if (Potree.Features.SHADER_SPLATS.isSupported()) {
		qualityOptions.push("Splats");
	}
	guiArgs.qualityOptions = qualityOptions;
	pQuality = fAppearance.add(params, 'quality', qualityOptions);
	pQuality.onChange(function (value) {
		quality = value;
		changeArgs.quality = value;
		guiChanged = true;
	});

	if (Potree.Features.SHADER_EDL.isSupported()) {
		pEDL = fAppearance.add(params, 'EDL');
		pEDL.onChange(function (value) {
			useEDL = value;
			changeArgs.EDL = value;
			guiChanged = true;
		});
		guiArgs.isEDLenabled = true;
	} else {
		guiArgs.isEDLenabled = false;
	}

	pFlipYZ = fAppearance.add(params, 'FlipYZ');
	pFlipYZ.onChange(function (value) {
		if (value != isFlipYZ)
			flipYZ();
		guiChanged = true;
	});

	pSkybox = fAppearance.add(params, 'skybox').listen();
	pSkybox.onChange(function (value) {
		showSkybox = value;
		changeArgs.skybox = value;
		guiChanged = true;
	});

	pSponsors = fAppearance.add(params, 'sponsors');
	pSponsors.onChange(function (value) {
		sponsors = value;
		changeArgs.sponsors = value;
		guiChanged = true;
	});

	// SETTINGS GUI FOLDER
	var fSettings = gui.addFolder('Settings');

	pClipMode = fSettings.add(params, 'Clip Mode', ["No Clipping", "Clip Outside", "Highlight Inside"]);
	pClipMode.onChange(function (value) {
		clipMode = setClipMode(value);
		changeArgs.ClipMode = value;
		guiChanged = true;
	});

	pDEMCollisions = fSettings.add(params, 'DEM Collisions');
	pDEMCollisions.onChange(function (value) {
		useDEMCollisions = value;
		changeArgs.DEMCollisions = value;
		guiChanged = true;
	});

	pMinNodeSize = fSettings.add(params, 'MinNodeSize', 0, 1500);
	pMinNodeSize.onChange(function (value) {
		minNodeSize = value;
		changeArgs.MinNodeSize = value;
		guiChanged = true;
	});

	// DEBUG GUI FOLDER
	var fDebug = gui.addFolder('Debug');

	pStats = fDebug.add(params, 'stats');
	pStats.onChange(function (value) {
		showStats = value;
		changeArgs.stats = value;
		guiChanged = true;
	});

	pBoundingBox = fDebug.add(params, 'BoundingBox');
	pBoundingBox.onChange(function (value) {
		showBoundingBox = value;
		changeArgs.BoundingBox = value;
		guiChanged = true;
	});

	pFreeze = fDebug.add(params, 'freeze');
	pFreeze.onChange(function (value) {
		freeze = value;
		changeArgs.freeze = value;
		guiChanged = true;
	});

	// stats
	stats = new Stats();
	document.getElementById("logo").appendChild(stats.domElement);
}

var pointcloudPath;
function getPath(onDone) {
	// Callback function which waits for a socket message containing the available Point Clouds in the Node server
	CPManager.on('sendJSONfile', function (data, callback) {
		console.debug("New Point Cloud:", data);
		var current_pointcloudPath = "resources/pointclouds/" + data + "/cloud.js";
		onDone(current_pointcloudPath);
	});
}

var initThree = function () {
	var width = elRenderArea.clientWidth;
	var height = elRenderArea.clientHeight;
	var aspect = width / height;
	var near = 0.1;
	var far = 1000 * 1000;

	scene = new THREE.Scene();
	scenePointCloud = new THREE.Scene();
	sceneBG = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	//camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 100000);
	cameraBG = new THREE.Camera();
	camera.rotation.order = 'ZYX';

	referenceFrame = new THREE.Object3D();
	scenePointCloud.add(referenceFrame);
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	renderer.autoClear = false;

	if (elRenderArea.firstChild) {
		elRenderArea.replaceChild(renderer.domElement, elRenderArea.firstChild);
	} else
		elRenderArea.appendChild(renderer.domElement);

	skybox = Potree.utils.loadSkybox("resources/textures/skybox/");

	// enable frag_depth extension for the interpolation shader, if available
	renderer.context.getExtension("EXT_frag_depth");

	THREELG.pointcloudPath = pointcloudPath;

	// load Potree
	getPath(function (pointcloudPath) {

		if (pointcloudPath.indexOf("cloud.js") > 0) {
			Potree.POCLoader.load(pointcloudPath, function (geometry) {
				pointcloud = new Potree.PointCloudOctree(geometry);
				pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
				pointcloud.material.size = pointSize;
				pointcloud.visiblePointsTarget = pointCountTarget * 1000.00 * 1000.00;

				referenceFrame.add(pointcloud);

				referenceFrame.updateMatrixWorld(true);
				var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);

				referenceFrame.position.copy(sg.center).multiplyScalar(-1);
				referenceFrame.updateMatrixWorld(true);

				if (sg.radius > 50 * 1000) {
					camera.near = 10;
				} else if (sg.radius > 10 * 1000) {
					camera.near = 2;
				} else if (sg.radius > 1000) {
					camera.near = 1;
				} else if (sg.radius > 100) {
					camera.near = 0.5;
				} else {
					camera.near = 0.1;
				}


				initGUI();
				camera.zoomTo(pointcloud, 0);

				if (controls) {
					controls.enabled = false;
				}
				useSpacenavControls();
			});
		}
	});

	var grid = Potree.utils.createGrid(5, 5, 2);
	if (showGrid)
		scene.add(grid);

	var texture = Potree.utils.createBackgroundTexture(512, 512);

	texture.minFilter = texture.magFilter = THREE.NearestFilter;
	texture.minFilter = texture.magFilter = THREE.LinearFilter;

	var bg = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(2, 2, 0),
			new THREE.MeshBasicMaterial({
				map : texture
			}));

	bg.material.depthTest = false;
	bg.material.depthWrite = false;
	sceneBG.add(bg);

	directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
	directionalLight.position.set(10, 10, 10);
	directionalLight.lookAt(new THREE.Vector3(0, 0, 0));
	scenePointCloud.add(directionalLight);

	var light = new THREE.AmbientLight(0x555555); // soft white light
	scenePointCloud.add(light);

	return {
		"scene" : scene,
		"camera" : camera,
		"renderer" : renderer
	};

}

function flipYZ() {

	isFlipYZ = !isFlipYZ;
	changeArgs.flipYZ = isFlipYZ;

	if (isFlipYZ) {
		referenceFrame.matrix.copy(new THREE.Matrix4());
		referenceFrame.applyMatrix(new THREE.Matrix4().set(
				1, 0, 0, 0,
				0, 0, 1, 0,
				0, -1, 0, 0,
				0, 0, 0, 1));

	} else {
		referenceFrame.matrix.copy(new THREE.Matrix4());
		referenceFrame.applyMatrix(new THREE.Matrix4().set(
				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1));
	}

	referenceFrame.updateMatrixWorld(true);
	pointcloud.updateMatrixWorld();
	var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
	referenceFrame.position.copy(sg.center).multiplyScalar(-1);
	referenceFrame.updateMatrixWorld(true);
	referenceFrame.position.y -= pointcloud.getWorldPosition().y;
	referenceFrame.updateMatrixWorld(true);
}

function useSpacenavControls() {
	if (controls) {
		controls.enabled = false;
	}
	if (!snControls) {
		// FirstPersonControls has a module called Multiaxis that loads
		// the Space Navigator listenner and maps the events to
		// the FirstPersonControls movements
		snControls = new THREE.FirstPersonControls(camera, renderer.domElement);
		snControls.addEventListener("proposeTransform", function (event) {
			if (!pointcloud || !useDEMCollisions) {
				return;
			}

			var demHeight = pointcloud.getDEMHeight(event.newPosition);
			if (event.newPosition.y < demHeight) {
				event.objections++;

				var counterProposal = event.newPosition.clone();
				counterProposal.y = demHeight;

				event.counterProposals.push(counterProposal);
			}
		});
	}
	controls = snControls;
	if (THREELG.master) {
		controls.addEventListener('change', changeEvent);
	}
	controls.enabled = true;

}

var intensityMax = null;
var heightMin = null;
var heightMax = null;

var PotreeRenderer = function () {

	this.render = function () { { // resize
			var width = elRenderArea.clientWidth;
			var height = elRenderArea.clientHeight;
			var aspect = width / height;

			camera.aspect = aspect;
			camera.updateProjectionMatrix();

			renderer.setSize(width, height);
		}

		// render skybox
		if (showSkybox) {
			skybox.camera.rotation.copy(camera.rotation);
			renderer.render(skybox.scene, skybox.camera);
		} else {
			renderer.render(sceneBG, cameraBG);
		}

		if (pointcloud) {
			if (pointcloud.originalMaterial) {
				pointcloud.material = pointcloud.originalMaterial;
			}

			var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);

			pointcloud.visiblePointsTarget = pointCountTarget * 1000.00 * 1000.00;
			pointcloud.material.size = pointSize;
			pointcloud.material.opacity = opacity;
			pointcloud.material.pointColorType = pointColorType;
			pointcloud.material.pointSizeType = pointSizeType;
			pointcloud.material.pointShape = (quality === "Circles") ? Potree.PointShape.CIRCLE : Potree.PointShape.SQUARE;
			pointcloud.material.interpolate = (quality === "Interpolation");
			pointcloud.material.weighted = false;
		}

		// render scene
		renderer.render(scene, camera);
		renderer.render(scenePointCloud, camera);

		//profileTool.render();
		//volumeTool.render();

		renderer.clearDepth();
		//measuringTool.render();
		//transformationTool.render();
	};
};
var potreeRenderer = new PotreeRenderer();

// high quality rendering using splats
var HighQualityRenderer = function () {

	var depthMaterial = null;
	var attributeMaterial = null;
	var normalizationMaterial = null;

	var rtDepth;
	var rtNormalize;

	var initHQSPlats = function () {
		if (depthMaterial != null) {
			return;
		}

		depthMaterial = new Potree.PointCloudMaterial();
		attributeMaterial = new Potree.PointCloudMaterial();

		depthMaterial.pointColorType = Potree.PointColorType.DEPTH;
		depthMaterial.pointShape = Potree.PointShape.CIRCLE;
		depthMaterial.interpolate = false;
		depthMaterial.weighted = false;
		depthMaterial.minSize = 2;

		attributeMaterial.pointShape = Potree.PointShape.CIRCLE;
		attributeMaterial.interpolate = false;
		attributeMaterial.weighted = true;
		attributeMaterial.minSize = 2;

		rtDepth = new THREE.WebGLRenderTarget(1024, 1024, {
				minFilter : THREE.NearestFilter,
				magFilter : THREE.NearestFilter,
				format : THREE.RGBAFormat,
				type : THREE.FloatType
			});

		rtNormalize = new THREE.WebGLRenderTarget(1024, 1024, {
				minFilter : THREE.LinearFilter,
				magFilter : THREE.NearestFilter,
				format : THREE.RGBAFormat,
				type : THREE.FloatType
			});

		var uniformsNormalize = {
			depthMap : {
				type : "t",
				value : rtDepth
			},
			texture : {
				type : "t",
				value : rtNormalize
			}
		};

		normalizationMaterial = new THREE.ShaderMaterial({
				uniforms : uniformsNormalize,
				vertexShader : Potree.Shaders["normalize.vs"],
				fragmentShader : Potree.Shaders["normalize.fs"]
			});
	}

	var resize = function (width, height) {
		if (rtDepth.width == width && rtDepth.height == height) {
			return;
		}

		rtDepth.dispose();
		rtNormalize.dispose();

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
		rtDepth.setSize(width, height);
		rtNormalize.setSize(width, height);
	};

	// render with splats
	this.render = function (renderer) {

		var width = elRenderArea.clientWidth;
		var height = elRenderArea.clientHeight;

		initHQSPlats();

		resize(width, height);

		renderer.clear();
		if (showSkybox) {
			skybox.camera.rotation.copy(camera.rotation);
			renderer.render(skybox.scene, skybox.camera);
		} else {
			renderer.render(sceneBG, cameraBG);
		}
		renderer.render(scene, camera);

		if (pointcloud) {

			depthMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
			attributeMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;

			pointcloud.visiblePointsTarget = pointCountTarget * 1000.00 * 1000.00;
			var originalMaterial = pointcloud.material;
			{ // DEPTH PASS
				depthMaterial.size = pointSize;
				depthMaterial.pointSizeType = pointSizeType;
				depthMaterial.screenWidth = width;
				depthMaterial.screenHeight = height;
				depthMaterial.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
				depthMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
				depthMaterial.fov = camera.fov * (Math.PI / 180);
				depthMaterial.spacing = pointcloud.pcoGeometry.spacing;
				depthMaterial.near = camera.near;
				depthMaterial.far = camera.far;
				depthMaterial.heightMin = heightMin;
				depthMaterial.heightMax = heightMax;
				depthMaterial.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
				depthMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
				depthMaterial.bbSize = pointcloud.material.bbSize;
				depthMaterial.treeType = pointcloud.material.treeType;

				scenePointCloud.overrideMaterial = depthMaterial;
				renderer.clearTarget(rtDepth, true, true, true);
				renderer.render(scenePointCloud, camera, rtDepth);
				scenePointCloud.overrideMaterial = null;
			}
			{ // ATTRIBUTE PASS
				attributeMaterial.size = pointSize;
				attributeMaterial.pointSizeType = pointSizeType;
				attributeMaterial.screenWidth = width;
				attributeMaterial.screenHeight = height;
				attributeMaterial.pointColorType = pointColorType;
				attributeMaterial.depthMap = rtDepth;
				attributeMaterial.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
				attributeMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
				attributeMaterial.fov = camera.fov * (Math.PI / 180);
				attributeMaterial.spacing = pointcloud.pcoGeometry.spacing;
				attributeMaterial.near = camera.near;
				attributeMaterial.far = camera.far;
				attributeMaterial.heightMin = heightMin;
				attributeMaterial.heightMax = heightMax;
				attributeMaterial.intensityMin = pointcloud.material.intensityMin;
				attributeMaterial.intensityMax = pointcloud.material.intensityMax;
				attributeMaterial.setClipBoxes(pointcloud.material.clipBoxes);
				attributeMaterial.clipMode = pointcloud.material.clipMode;
				attributeMaterial.bbSize = pointcloud.material.bbSize;
				attributeMaterial.treeType = pointcloud.material.treeType;

				scenePointCloud.overrideMaterial = attributeMaterial;
				renderer.clearTarget(rtNormalize, true, true, true);
				renderer.render(scenePointCloud, camera, rtNormalize);
				scenePointCloud.overrideMaterial = null;
			}
			{ // NORMALIZATION PASS
				normalizationMaterial.uniforms.depthMap.value = rtDepth;
				normalizationMaterial.uniforms.texture.value = rtNormalize;
				Potree.utils.screenPass.render(renderer, normalizationMaterial);
			}

			pointcloud.material = originalMaterial;

			renderer.clearDepth();

		}

	}
};
var highQualityRenderer = new HighQualityRenderer();

var EDLRenderer = function () {

	var edlMaterial = null;
	var attributeMaterial = null;

	var rtColor = null;

	var initEDL = function () {
		if (edlMaterial != null) {
			return;
		}

		edlMaterial = new Potree.EyeDomeLightingMaterial();
		attributeMaterial = new Potree.PointCloudMaterial();

		attributeMaterial.pointShape = Potree.PointShape.CIRCLE;
		attributeMaterial.interpolate = false;
		attributeMaterial.weighted = false;
		attributeMaterial.minSize = 2;
		attributeMaterial.useLogarithmicDepthBuffer = false;
		attributeMaterial.useEDL = true;

		rtColor = new THREE.WebGLRenderTarget(1024, 1024, {
				minFilter : THREE.LinearFilter,
				magFilter : THREE.NearestFilter,
				format : THREE.RGBAFormat,
				type : THREE.FloatType,
			});

	};

	var resize = function () {
		var width = elRenderArea.clientWidth;
		var height = elRenderArea.clientHeight;
		var aspect = width / height;

		var needsResize = (rtColor.width != width || rtColor.height != height);

		// disposal will be unnecessary once this fix made it into three.js master:
		// https://github.com/mrdoob/three.js/pull/6355
		if (needsResize) {
			rtColor.dispose();
		}

		camera.aspect = aspect;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
		rtColor.setSize(width, height);

	}

	this.render = function () {

		initEDL();

		resize();

		renderer.clear();
		if (showSkybox) {
			skybox.camera.rotation.copy(camera.rotation);
			renderer.render(skybox.scene, skybox.camera);
		} else {
			renderer.render(sceneBG, cameraBG);
		}
		renderer.render(scene, camera);

		if (pointcloud) {
			var width = elRenderArea.clientWidth;
			var height = elRenderArea.clientHeight;

			var octreeSize = pointcloud.pcoGeometry.boundingBox.size().x;

			pointcloud.visiblePointsTarget = pointCountTarget * 1000.00 * 1000.00;
			var originalMaterial = pointcloud.material;
			{ // COLOR & DEPTH PASS
				attributeMaterial.size = pointSize;
				attributeMaterial.pointSizeType = pointSizeType;
				attributeMaterial.screenWidth = width;
				attributeMaterial.screenHeight = height;
				attributeMaterial.pointColorType = pointColorType;
				attributeMaterial.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
				attributeMaterial.uniforms.octreeSize.value = octreeSize;
				attributeMaterial.fov = camera.fov * (Math.PI / 180);
				attributeMaterial.spacing = pointcloud.pcoGeometry.spacing;
				attributeMaterial.near = camera.near;
				attributeMaterial.far = camera.far;
				attributeMaterial.heightMin = heightMin;
				attributeMaterial.heightMax = heightMax;
				attributeMaterial.intensityMin = pointcloud.material.intensityMin;
				attributeMaterial.intensityMax = pointcloud.material.intensityMax;
				attributeMaterial.setClipBoxes(pointcloud.material.clipBoxes);
				attributeMaterial.clipMode = pointcloud.material.clipMode;
				attributeMaterial.bbSize = pointcloud.material.bbSize;
				attributeMaterial.treeType = pointcloud.material.treeType;

				scenePointCloud.overrideMaterial = attributeMaterial;
				renderer.clearTarget(rtColor, true, true, true);
				renderer.render(scenePointCloud, camera, rtColor);
				scenePointCloud.overrideMaterial = null;
			}
			{ // EDL OCCLUSION PASS
				edlMaterial.uniforms.screenWidth.value = width;
				edlMaterial.uniforms.screenHeight.value = height;
				edlMaterial.uniforms.near.value = camera.near;
				edlMaterial.uniforms.far.value = camera.far;
				edlMaterial.uniforms.colorMap.value = rtColor;
				edlMaterial.uniforms.expScale.value = camera.far;

				//edlMaterial.uniforms.depthMap.value = depthTexture;

				Potree.utils.screenPass.render(renderer, edlMaterial);
			}

			renderer.render(scene, camera);

			//profileTool.render();
			//volumeTool.render();
			renderer.clearDepth();
			//measuringTool.render();
			//transformationTool.render();
		}

	}
};
var edlRenderer = new EDLRenderer();

render = function (initialScene) {
	if (undefined !== render) {
		requestAnimationFrame(this.render.bind(this));
	}

	Potree.pointLoadLimit = pointCountTarget * 2 * 1000.00 * 1000.00;

	directionalLight.position.copy(camera.position);
	directionalLight.lookAt(new THREE.Vector3().addVectors(camera.position, camera.getWorldDirection()));
	pointcloud = referenceFrame.children[0];

	if (pointcloud) {
		var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);

		if (!this.intensityMax) {
			var root = pointcloud.pcoGeometry.root;
			if (root != null && root.loaded) {
				var attributes = pointcloud.pcoGeometry.root.geometry.attributes;
				if (attributes.intensity) {
					var array = attributes.intensity.array;
					var max = 0;
					for (var i = 0; i < array.length; i++) {
						max = Math.max(array[i]);
					}

					if (max <= 1) {
						this.intensityMax = 1;
					} else if (max <= 256) {
						this.intensityMax = 255;
					} else {
						this.intensityMax = max;
					}
				}
			}
		}

		if (this.heightMin === null) {
			this.heightMin = bbWorld.min.y;
			this.heightMax = bbWorld.max.y;
		}

		pointcloud.material.clipMode = clipMode;
		pointcloud.material.heightMin = this.heightMin;
		pointcloud.material.heightMax = this.heightMax;
		pointcloud.material.intensityMin = 0;
		pointcloud.material.intensityMax = this.intensityMax;
		pointcloud.showBoundingBox = showBoundingBox;
		pointcloud.generateDEM = useDEMCollisions;
		pointcloud.minimumNodePixelSize = minNodeSize;

		if (!freeze) {
			pointcloud.update(camera, renderer);
		}
	}
	if (stats) {
		if (showStats) {
			document.getElementById("lblNumVisibleNodes").style.display = "";
			document.getElementById("lblNumVisiblePoints").style.display = "";
			stats.domElement.style.display = "";

			stats.update();

			document.getElementById("lblNumVisibleNodes").innerHTML = "visible nodes: " + pointcloud.numVisibleNodes;
			document.getElementById("lblNumVisiblePoints").innerHTML = "visible points: " + Potree.utils.addCommas(pointcloud.numVisiblePoints);
		} else {
			document.getElementById("lblNumVisibleNodes").style.display = "none";
			document.getElementById("lblNumVisiblePoints").style.display = "none";
			stats.domElement.style.display = "none";
		}
	}

	if (sponsors)
		document.getElementById("sponsors").style.display = "inline";
	else
		document.getElementById("sponsors").style.display = "none";

	camera.fov = fov;

	if (controls) {
		controls.update(0.1);
	}

	// update progress bar
	if (pointcloud) {
		var progress = pointcloud.progress;

		progressBar.progress = progress;

		var message;
		if (progress === 0 || pointcloud instanceof Potree.PointCloudArena4D) {
			message = "loading";
		} else {
			message = "loading: " + parseInt(progress * 100) + "%";
		}
		progressBar.message = message;

		if (progress === 1) {
			progressBar.hide();
		} else if (progress < 1) {
			progressBar.show();
		}
	}
	// Render with the selected renderer
	if (useEDL) {
		edlRenderer.render(renderer);
	} else if (quality === "Splats") {
		highQualityRenderer.render(renderer);
	} else {
		potreeRenderer.render();
	}

};


// Initialize THREELG and get some variables
THREE.lg_init('appname', preRenderMaster, preRenderSlave, initThree, render, true);

a = initThree();

scene = a.scene;
camera = a.camera;

render();
