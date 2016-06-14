
if(sceneProperties.useEDL && !Potree.Features.SHADER_EDL.isSupported()){
	sceneProperties.useEDL = false;
}

if(sceneProperties.quality === null){
	sceneProperties.quality = "Squares";
}

var fov = sceneProperties.fov;
var pointSize = sceneProperties.pointSize;
var pointCountTarget = sceneProperties.pointLimit;
var opacity = 1;
var pointSizeType = null;
var pointColorType = null;
var pointShape = Potree.PointShape.SQUARE;
var clipMode = Potree.ClipMode.HIGHLIGHT_INSIDE;
var quality = null;
var isFlipYZ = false;
var useDEMCollisions = false;
var minNodeSize = 100;
var directionalLight;


var firstFlipYZ = sceneProperties.flipYZ;
var showStats = false;
var showBoundingBox = false;
var freeze = false;

var controls;
var snControls;
var progressBar = new ProgressBar();

var pointcloudPath = sceneProperties.path;

var elRenderArea = document.getElementById("renderArea");

var gui;
var renderer;
var camera;
var scene;
var scenePointCloud;
var sceneBG, cameraBG;
var pointcloud;
var skybox;
var stats;
var clock = new THREE.Clock();
var showSkybox = false;
var referenceFrame;

function setPointSizeType(value){
	if(value === "Fixed"){
		pointSizeType = Potree.PointSizeType.FIXED;
	}else if(value === "Attenuated"){
		pointSizeType = Potree.PointSizeType.ATTENUATED;
	}else if(value === "Adaptive"){
		pointSizeType = Potree.PointSizeType.ADAPTIVE;
	}
};

function setQuality(value){
	

	if(value == "Interpolation" && !Potree.Features.SHADER_INTERPOLATION.isSupported()){
		quality = "Squares";
	}else if(value == "Splats" && !Potree.Features.SHADER_SPLATS.isSupported()){
		quality = "Squares";
	}else{
		quality = value;
	}
};

function setMaterial(value){
	if(value === "RGB"){
		pointColorType = Potree.PointColorType.RGB;
	}else if(value === "Color"){
		pointColorType = Potree.PointColorType.COLOR;
	}else if(value === "Elevation"){
		pointColorType = Potree.PointColorType.HEIGHT;
	}else if(value === "Intensity"){
		pointColorType = Potree.PointColorType.INTENSITY;
	}else if(value === "Intensity Gradient"){
		pointColorType = Potree.PointColorType.INTENSITY_GRADIENT;
	}else if(value === "Classification"){
		pointColorType = Potree.PointColorType.CLASSIFICATION;
	}else if(value === "Return Number"){
		pointColorType = Potree.PointColorType.RETURN_NUMBER;
	}else if(value === "Source"){
		pointColorType = Potree.PointColorType.SOURCE;
	}else if(value === "Tree Depth"){
		pointColorType = Potree.PointColorType.TREE_DEPTH;
	}else if(value === "Point Index"){
		pointColorType = Potree.PointColorType.POINT_INDEX;
	}else if(value === "Normal"){
		pointColorType = Potree.PointColorType.NORMAL;
	}else if(value === "Phong"){
		pointColorType = Potree.PointColorType.PHONG;
	}
};

var changeArgs     = { rotation: null, position: null};//, phiDelta: null, thetaDelta: null};
var lastChangeArgs = { rotation: null, position: null};//, phiDelta: null, thetaDelta: null };
var guiChanged = false;
var preRenderMaster = function () {
	// Send a packet to the slave if:
	//  * We've just initialized  -- or --
	//  * Something has changed on the GUI -- or --
	//  * Something has changed in the target or the position
	// Unless changeArgs.position is null

	if ( changeArgs.position !== null && ( THREELG.justInitialized || guiChanged ||
				(lastChangeArgs.position != null &&	Math.abs(changeArgs.position.distanceTo(lastChangeArgs.position)) > 1e-10)
				 ||(lastChangeArgs.rotation   != null && changeArgs.rotation != lastChangeArgs.rotation)
				)) {
		delete changeArgs.skipSlaveRender;
		guiChanged = false;
		THREELG.justInitialized = false;
	}
	else {
		changeArgs.skipSlaveRender = 1;
	}
	//lastChangeArgs.LOD       = changeArgs.LOD;
	//lastChangeArgs.pointsize = changeArgs.pointsize;

	if (changeArgs.position !== null) {
		lastChangeArgs.position  = changeArgs.position;
	}
	if(changeArgs.rotation !== null){
		lastChangeArgs.rotation = changeArgs.rotation;	
	}

	return changeArgs;
};


var preRenderSlave = function (a) {
	var yawOffset;
	
	
	var oParametre = {};

	if (window.location.search.length > 1) {
	  for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
		aItKey = aCouples[nKeyId].split("=");
		oParametre[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
	  }
	}
	if(oParametre.yawOffset)
		yawOffset = oParametre.yawOffset;
	else
		yawOffset = 1;

	//console.log(JSON.stringify(a));
	camera.position.copy(a.position);
	camera.rotation.copy(a.rotation)
	camera.rotateOnAxis((new THREE.Vector3(0, -1, 0)), yawOffset*rotationAngle*Math.PI/180);

	scene.children.forEach(function(c) { c.LOD = a.LOD; });
	scene.children[0].material.size = a.pointsize;
};

var changeEvent = function(event) {
	changeArgs.rotation = event.target.object.rotation.clone();
	changeArgs.position = event.target.object.position.clone();
}

function initGUI(){

	setPointSizeType(sceneProperties.sizeType);
	setQuality(sceneProperties.quality);
	setMaterial(sceneProperties.material);

	gui = new dat.GUI({
	});
	
	params = {
		"points(m)": pointCountTarget,
		PointSize: pointSize,
		"FOV": sceneProperties.fov,
		"opacity": opacity,
		"SizeType" : sceneProperties.sizeType,
		"show octree" : false,
		"Materials" : sceneProperties.material,
		"Clip Mode": "Highlight Inside",
		"quality": sceneProperties.quality,
		"EDL": sceneProperties.useEDL,
		"skybox": false,
		"stats": showStats,
		"BoundingBox": showBoundingBox,
		"DEM Collisions": useDEMCollisions,
		"MinNodeSize": minNodeSize,
		"freeze": freeze
	};
	
	var pPoints = gui.add(params, 'points(m)', 0, 4);
	pPoints.onChange(function(value){
		pointCountTarget = value ;
	});
	
	var fAppearance = gui.addFolder('Appearance');
	
	var pPointSize = fAppearance.add(params, 'PointSize', 0, 3);
	pPointSize.onChange(function(value){
		pointSize = value;
	});
	
	var fFOV = fAppearance.add(params, 'FOV', 20, 100);
	fFOV.onChange(function(value){
		fov = value;
	});
	
	var pOpacity = fAppearance.add(params, 'opacity', 0, 1);
	pOpacity.onChange(function(value){
		opacity = value;
	});
	
	var pSizeType = fAppearance.add(params, 'SizeType', [ "Fixed", "Attenuated", "Adaptive"]);
	pSizeType.onChange(function(value){
		setPointSizeType(value);
	});
	
	
	var options = [];
	var attributes = pointcloud.pcoGeometry.pointAttributes;
	if(attributes === "LAS" || attributes === "LAZ"){
		options = [ 
		"RGB", "Color", "Elevation", "Intensity", "Intensity Gradient", 
		"Classification", "Return Number", "Source",
		"Tree Depth"];
	}else{
		for(var i = 0; i < attributes.attributes.length; i++){
			var attribute = attributes.attributes[i];
			
			if(attribute === Potree.PointAttribute.COLOR_PACKED){
				options.push("RGB");
			}else if(attribute === Potree.PointAttribute.INTENSITY){
				options.push("Intensity");
				options.push("Intensity Gradient");
			}else if(attribute === Potree.PointAttribute.CLASSIFICATION){
				options.push("Classification");
			}
		}
		if(attributes.hasNormals()){
			options.push("Phong");
			options.push("Normal");
		}
		
		options.push("Elevation");
		options.push("Color");
		options.push("Tree Depth");
	}
	
	// default material is not available. set material to Elevation
	if(options.indexOf(params.Materials) < 0){
		console.error("Default Material '" + params.Material + "' is not available. Using RGB instead");
		setMaterial("RGB");
		params.Materials = "RGB";
	}
	
	pMaterial = fAppearance.add(params, 'Materials',options);
	pMaterial.onChange(function(value){
		setMaterial(value);
	});
	
	var qualityOptions = ["Squares", "Circles"];
	if(Potree.Features.SHADER_INTERPOLATION.isSupported()){
		qualityOptions.push("Interpolation");
	}
	if(Potree.Features.SHADER_SPLATS.isSupported()){
		qualityOptions.push("Splats");
	}
	var pQuality = fAppearance.add(params, 'quality', qualityOptions);
	pQuality.onChange(function(value){
		quality = value;
	});
	
	if(Potree.Features.SHADER_EDL.isSupported()){
		var pEDL = fAppearance.add(params, 'EDL');
		pEDL.onChange(function(value){
			sceneProperties.useEDL = value;
		});
	}
	
	var pSykbox = fAppearance.add(params, 'skybox');
	pSykbox.onChange(function(value){
		showSkybox = value;
	});
	
	var fSettings = gui.addFolder('Settings');
	
	var pClipMode = fSettings.add(params, 'Clip Mode', [ "No Clipping", "Clip Outside", "Highlight Inside"]);
	pClipMode.onChange(function(value){
		if(value === "No Clipping"){
			clipMode = Potree.ClipMode.DISABLED;
		}else if(value === "Clip Outside"){
			clipMode = Potree.ClipMode.CLIP_OUTSIDE;
		}else if(value === "Highlight Inside"){
			clipMode = Potree.ClipMode.HIGHLIGHT_INSIDE;
		}
	});
	
	var pDEMCollisions = fSettings.add(params, 'DEM Collisions');
	pDEMCollisions.onChange(function(value){
		useDEMCollisions = value;
	});
	
	var pMinNodeSize = fSettings.add(params, 'MinNodeSize', 0, 1500);
	pMinNodeSize.onChange(function(value){
		minNodeSize = value;
	});
	
	
	
	
	var fDebug = gui.addFolder('Debug');

	
	var pStats = fDebug.add(params, 'stats');
	pStats.onChange(function(value){
		showStats = value;
	});
	
	var pBoundingBox = fDebug.add(params, 'BoundingBox');
	pBoundingBox.onChange(function(value){
		showBoundingBox = value;
	});
	
	var pFreeze = fDebug.add(params, 'freeze');
	pFreeze.onChange(function(value){
		freeze = value;
	});

	// stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.margin = '5px';
	document.body.appendChild( stats.domElement );
	

}

var initThree = function (){
	var width = elRenderArea.clientWidth;
	var height = elRenderArea.clientHeight;
	var aspect = width / height;
	var near = 0.1;
	var far = 1000*1000;

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

	//console.debug(elRenderArea.firstChild)
	//console.debug(elRenderArea)
	
	if(elRenderArea.firstChild){
		elRenderArea.replaceChild(renderer.domElement, elRenderArea.firstChild);
		if(firstFlipYZ)
				flipYZ();
	}
	else
		elRenderArea.appendChild(renderer.domElement);
	
	skybox = Potree.utils.loadSkybox("../resources/textures/skybox/");

	// camera and controls
	//camera.position.set(-304, 0555, 318);
	//camera.rotation.y = -Math.PI / 4;
	//camera.rotation.x = -Math.PI / 6;

	useSpacenavControls();

	
	// enable frag_depth extension for the interpolation shader, if available
	renderer.context.getExtension("EXT_frag_depth");
	
	// load pointcloud
	if(!pointcloudPath){
		
	}else if(pointcloudPath.indexOf("cloud.js") > 0){
		Potree.POCLoader.load(pointcloudPath, function(geometry){
			pointcloud = new Potree.PointCloudOctree(geometry);
			
			pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
			pointcloud.material.size = pointSize;
			pointcloud.visiblePointsTarget = pointCountTarget * 1000 * 1000;
			
			referenceFrame.add(pointcloud);
			
			referenceFrame.updateMatrixWorld(true);
			var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
			
			referenceFrame.position.copy(sg.center).multiplyScalar(-1);
			referenceFrame.updateMatrixWorld(true);
			
			if(sg.radius > 50*1000){
				camera.near = 10;
			}else if(sg.radius > 10*1000){
				camera.near = 2;
			}else if(sg.radius > 1000){
				camera.near = 1;
			}else if(sg.radius > 100){
				camera.near = 0.5;
			}else{
				camera.near = 0.1;
			}

			if(firstFlipYZ)
				flipYZ();
			camera.zoomTo(pointcloud, 1);
			
			initGUI();	
			
			if(sceneProperties.cameraPosition != null){
				var cp = new THREE.Vector3(sceneProperties.cameraPosition[0], sceneProperties.cameraPosition[1], sceneProperties.cameraPosition[2]);
				camera.position.copy(cp);
			}
			
			if(sceneProperties.cameraTarget != null){
				var ct = new THREE.Vector3(sceneProperties.cameraTarget[0], sceneProperties.cameraTarget[1], sceneProperties.cameraTarget[2]);
				camera.lookAt(ct);

			}
			
		});
	}else if(pointcloudPath.indexOf(".vpc") > 0){
		Potree.PointCloudArena4DGeometry.load(pointcloudPath, function(geometry){
			pointcloud = new Potree.PointCloudArena4D(geometry);
			pointcloud.visiblePointsTarget = 500*1000;
			
			referenceFrame.add(pointcloud);
			
			if(firstFlipYZ)
				flipYZ();
			
			referenceFrame.updateMatrixWorld(true);
			var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
			
			referenceFrame.position.sub(sg.center);
			referenceFrame.position.y += sg.radius / 2;
			referenceFrame.updateMatrixWorld(true);
			
			camera.zoomTo(pointcloud, 1);
			
			initGUI();
			
			pointcloud.material.interpolation = false;
			pointcloud.material.pointSizeType = Potree.PointSizeType.ATTENUATED;
		
			if(sceneProperties.cameraPosition != null){
				var cp = new THREE.Vector3(sceneProperties.cameraPosition[0], sceneProperties.cameraPosition[1], sceneProperties.cameraPosition[2]);
				camera.position.copy(cp);
			}
			
			if(sceneProperties.cameraTarget != null){
				var ct = new THREE.Vector3(sceneProperties.cameraTarget[0], sceneProperties.cameraTarget[1], sceneProperties.cameraTarget[2]);
				camera.lookAt(ct);
			}
			
		});
	}
	
	var grid = Potree.utils.createGrid(5, 5, 2);
	scene.add(grid);
	
	var texture = Potree.utils.createBackgroundTexture(512, 512);
	
	texture.minFilter = texture.magFilter = THREE.NearestFilter;
	texture.minFilter = texture.magFilter = THREE.LinearFilter;
	
	var bg = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(2, 2, 0),
		new THREE.MeshBasicMaterial({
			map: texture
		})
	);
	
	bg.material.depthTest = false;
	bg.material.depthWrite = false;
	sceneBG.add(bg);			
	
	//window.addEventListener( 'keydown', onKeyDown, false );
	
	directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set( 10, 10, 10 );
	directionalLight.lookAt( new THREE.Vector3(0, 0, 0));
	scenePointCloud.add( directionalLight );
	
	var light = new THREE.AmbientLight( 0x555555 ); // soft white light
	scenePointCloud.add( light );
	
	return { "scene" : scene, "camera" : camera, "renderer" : renderer };

}

function flipYZ(){
	isFlipYZ = !isFlipYZ;
	
	if(isFlipYZ){
		referenceFrame.matrix.copy(new THREE.Matrix4());
		referenceFrame.applyMatrix(new THREE.Matrix4().set(
			1,0,0,0,
			0,0,1,0,
			0,-1,0,0,
			0,0,0,1
		));
		
	}else{
		referenceFrame.matrix.copy(new THREE.Matrix4());
		referenceFrame.applyMatrix(new THREE.Matrix4().set(
			1,0,0,0,
			0,1,0,0,
			0,0,1,0,
			0,0,0,1
		));
	}
	
	referenceFrame.updateMatrixWorld(true);
	pointcloud.updateMatrixWorld();
	var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
	referenceFrame.position.copy(sg.center).multiplyScalar(-1);
	referenceFrame.updateMatrixWorld(true);
	referenceFrame.position.y -= pointcloud.getWorldPosition().y;
	referenceFrame.updateMatrixWorld(true);
}

var intensityMax = null;
var heightMin = null;
var heightMax = null;
function useSpacenavControls(){
	if(controls){
		controls.enabled = false;
	}
	if(!snControls){
		snControls = new THREE.FirstPersonControls(camera, renderer.domElement);
		snControls.addEventListener("proposeTransform", function(event){
			if(!pointcloud || !useDEMCollisions){
				return;
			}
			
			var demHeight = pointcloud.getDEMHeight(event.newPosition);
			if(event.newPosition.y < demHeight){
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
	
	controls.moveSpeed = 5;
	
	
}


var PotreeRenderer = function(){

	this.render = function(){
		{// resize
			var width = elRenderArea.clientWidth;
			var height = elRenderArea.clientHeight;
			var aspect = width / height;
			
			camera.aspect = aspect;
			camera.updateProjectionMatrix();
			
			renderer.setSize(width, height);
		}
		

		// render skybox
		if(showSkybox){
			skybox.camera.rotation.copy(camera.rotation);
			renderer.render(skybox.scene, skybox.camera);
		}else{
			renderer.render(sceneBG, cameraBG);
		}
		
		if(pointcloud){
			if(pointcloud.originalMaterial){
				pointcloud.material = pointcloud.originalMaterial;
			}
			
			var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);
			
			pointcloud.visiblePointsTarget = pointCountTarget * 1000 * 1000;
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
var highQualityRenderer = null;
var HighQualityRenderer = function(){

	var depthMaterial = null;
	var attributeMaterial = null;
	var normalizationMaterial = null;
	
	var rtDepth;
	var rtNormalize;
	
	var initHQSPlats = function(){
		if(depthMaterial != null){
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

		rtDepth = new THREE.WebGLRenderTarget( 1024, 1024, { 
			minFilter: THREE.NearestFilter, 
			magFilter: THREE.NearestFilter, 
			format: THREE.RGBAFormat, 
			type: THREE.FloatType
		} );

		rtNormalize = new THREE.WebGLRenderTarget( 1024, 1024, { 
			minFilter: THREE.LinearFilter, 
			magFilter: THREE.NearestFilter, 
			format: THREE.RGBAFormat, 
			type: THREE.FloatType
		} );
		
		var uniformsNormalize = {
			depthMap: { type: "t", value: rtDepth },
			texture: { type: "t", value: rtNormalize }
		};
		
		normalizationMaterial = new THREE.ShaderMaterial({
			uniforms: uniformsNormalize,
			vertexShader: Potree.Shaders["normalize.vs"],
			fragmentShader: Potree.Shaders["normalize.fs"]
		});
	}
	
	var resize = function(width, height){
		if(rtDepth.width == width && rtDepth.height == height){
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
	this.render = function(renderer){
	
		var width = elRenderArea.clientWidth;
		var height = elRenderArea.clientHeight;
	
		initHQSPlats();
		
		resize(width, height);
		
		
		renderer.clear();
		if(showSkybox){
			skybox.camera.rotation.copy(camera.rotation);
			renderer.render(skybox.scene, skybox.camera);
		}else{
			renderer.render(sceneBG, cameraBG);
		}
		renderer.render(scene, camera);
		
		if(pointcloud){
		
			depthMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
			attributeMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
		
			pointcloud.visiblePointsTarget = pointCountTarget * 1000 * 1000;
			var originalMaterial = pointcloud.material;
			
			{// DEPTH PASS
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
				renderer.clearTarget( rtDepth, true, true, true );
				renderer.render(scenePointCloud, camera, rtDepth);
				scenePointCloud.overrideMaterial = null;
			}
			
			{// ATTRIBUTE PASS
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
				renderer.clearTarget( rtNormalize, true, true, true );
				renderer.render(scenePointCloud, camera, rtNormalize);
				scenePointCloud.overrideMaterial = null;
			}
			
			{// NORMALIZATION PASS
				normalizationMaterial.uniforms.depthMap.value = rtDepth;
				normalizationMaterial.uniforms.texture.value = rtNormalize;
				Potree.utils.screenPass.render(renderer, normalizationMaterial);
			}
			
			pointcloud.material = originalMaterial;
		    
			renderer.clearDepth();

		}


	}
};

var edlRenderer = null;
var EDLRenderer = function(){

	var edlMaterial = null;
	var attributeMaterial = null;
	
	//var depthTexture = null;
	
	var rtColor = null;
	var gl = renderer.context;
	
	var initEDL = function(){
		if(edlMaterial != null){
			return;
		}
		
		//var depthTextureExt = gl.getExtension("WEBGL_depth_texture"); 
		
		edlMaterial = new Potree.EyeDomeLightingMaterial();
		attributeMaterial = new Potree.PointCloudMaterial();
					
		attributeMaterial.pointShape = Potree.PointShape.CIRCLE;
		attributeMaterial.interpolate = false;
		attributeMaterial.weighted = false;
		attributeMaterial.minSize = 2;
		attributeMaterial.useLogarithmicDepthBuffer = false;
		attributeMaterial.useEDL = true;

		rtColor = new THREE.WebGLRenderTarget( 1024, 1024, { 
			minFilter: THREE.LinearFilter, 
			magFilter: THREE.NearestFilter, 
			format: THREE.RGBAFormat, 
			type: THREE.FloatType,
			//type: THREE.UnsignedByteType,
			//depthBuffer: false,
			//stencilBuffer: false
		} );
		
		//depthTexture = new THREE.Texture();
		//depthTexture.__webglInit = true;
		//depthTexture.__webglTexture = gl.createTexture();;
		//gl.bindTexture(gl.TEXTURE_2D, depthTexture.__webglTexture);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 1024, 1024, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
	};
	
	var resize = function(){
		var width = elRenderArea.clientWidth;
		var height = elRenderArea.clientHeight;
		var aspect = width / height;
		
		var needsResize = (rtColor.width != width || rtColor.height != height);
	
		// disposal will be unnecessary once this fix made it into three.js master: 
		// https://github.com/mrdoob/three.js/pull/6355
		if(needsResize){
			rtColor.dispose();
		}
		
		camera.aspect = aspect;
		camera.updateProjectionMatrix();
		
		renderer.setSize(width, height);
		rtColor.setSize(width, height);
		
	}

	this.render = function(){
	
		initEDL();
		
		resize();
		
		renderer.clear();
		if(showSkybox){
			skybox.camera.rotation.copy(camera.rotation);
			renderer.render(skybox.scene, skybox.camera);
		}else{
			renderer.render(sceneBG, cameraBG);
		}
		renderer.render(scene, camera);
		
		if(pointcloud){
			var width = elRenderArea.clientWidth;
			var height = elRenderArea.clientHeight;
		
			var octreeSize = pointcloud.pcoGeometry.boundingBox.size().x;
		
			pointcloud.visiblePointsTarget = pointCountTarget * 1000 * 1000;
			var originalMaterial = pointcloud.material;
			
			{// COLOR & DEPTH PASS
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
				renderer.clearTarget( rtColor, true, true, true );
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

render = function (initialScene) {
		if (undefined !== render) {
		requestAnimationFrame(this.render.bind(this));
	}
	
	Potree.pointLoadLimit = pointCountTarget * 2 * 1000 * 1000;
	
	directionalLight.position.copy(camera.position);
	directionalLight.lookAt(new THREE.Vector3().addVectors(camera.position, camera.getWorldDirection()));
	var pointcloud = referenceFrame.children[0];

	if(pointcloud){
		
		var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);
			
		if(!this.intensityMax){
			var root = pointcloud.pcoGeometry.root;
			if(root != null && root.loaded){
				var attributes = pointcloud.pcoGeometry.root.geometry.attributes;
				if(attributes.intensity){
					var array = attributes.intensity.array;
					var max = 0;
					for(var i = 0; i < array.length; i++){
						max = Math.max(array[i]);
					}
					
					if(max <= 1){
						this.intensityMax = 1;
					}else if(max <= 256){
						this.intensityMax = 255;
					}else{
						this.intensityMax = max;
					}
				}
			}
		}
		
		if(this.heightMin === null){
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
		
		if(!freeze){
			pointcloud.update(camera, renderer);
		}
	}
	
	if(stats && showStats){
		document.getElementById("lblNumVisibleNodes").style.display = "";
	    document.getElementById("lblNumVisiblePoints").style.display = "";
	    stats.domElement.style.display = "";
	
		stats.update();
	
		if(pointcloud){
			document.getElementById("lblNumVisibleNodes").innerHTML = "visible nodes: " + pointcloud.numVisibleNodes;
			document.getElementById("lblNumVisiblePoints").innerHTML = "visible points: " + Potree.utils.addCommas(pointcloud.numVisiblePoints);
		}
	}else if(stats){
		document.getElementById("lblNumVisibleNodes").style.display = "none";
	    document.getElementById("lblNumVisiblePoints").style.display = "none";
	    stats.domElement.style.display = "none";
	}
	
	camera.fov = fov;
	
	if(controls){
		controls.update(0.1);
	}

	// update progress bar
	if(pointcloud){
		var progress = pointcloud.progress;
		
		progressBar.progress = progress;
		
		var message;
		if(progress === 0 || pointcloud instanceof Potree.PointCloudArena4D){
			message = "loading";
		}else{
			message = "loading: " + parseInt(progress*100) + "%";
		}
		progressBar.message = message;
		
		if(progress === 1){
			progressBar.hide();
		}else if(progress < 1){
			progressBar.show();
		}
	}

	if(sceneProperties.useEDL){
		if(!edlRenderer){
			edlRenderer = new EDLRenderer();
		}
		edlRenderer.render(renderer);
	}else if(quality === "Splats"){
		if(!highQualityRenderer){
			highQualityRenderer = new HighQualityRenderer();
		}
		highQualityRenderer.render(renderer);
	}else{
		potreeRenderer.render();
	}
};


THREE.lg_init('appname', preRenderMaster, preRenderSlave, initThree, render, true);
a = initThree();
scene = a.scene;
camera = a.camera;

render();

//initGUI();
