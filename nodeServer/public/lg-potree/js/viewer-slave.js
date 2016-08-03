var firstFlipYZ = sceneProperties.flipYZ;

var isFlipYZ = false;
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


var defaultPointSize = 0.03;
var defaultLOD = 15;
var pointcloudPath;
var pointclouds = [];
var render;
var visnodes;
var controls;

var stats;

var fov = sceneProperties.fov;
var pointSize = sceneProperties.pointSize;
var pointCountTarget = sceneProperties.pointLimit;
var opacity = 1;
var pointSizeType = null;
var pointColorType = null;
var pointShape = Potree.PointShape.SQUARE;
var clipMode = Potree.ClipMode.HIGHLIGHT_INSIDE;
var quality = null;

var useDEMCollisions = false;
var minNodeSize = 100;
var directionalLight;


var showStats = false;
var showBoundingBox = false;
var freeze = false;
var showGrid;

var progressBar = new ProgressBar();
var snControls;
function useSpacenavControls(){}
var controls;
var pointcloudPath = sceneProperties.path;
var elRenderArea = document.getElementById("renderArea");
 var changeEvent = function(event) {
            newPosition = event.target.object.position;
            newRotation = event.target.object.rotation;
        }


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

// Create SocketIO instance, connect
var CPManager = io.connect('/manager');

// Add a connect listener
CPManager.on('connect', function() {
	console.log('Client has connected to the server!');
	CPManager.emit('getJSONfile');
});
CPManager.on('refresh', function() {
	console.log("REFRESH");
     window.location.reload(true); 
});

// Add a disconnect listener
CPManager.on('disconnect', function() {
	console.log('The client has disconnected!');
});
	
CPManager.on('sendJSONfile', function(data, callback){
	console.debug("New Point Cloud:", data);
	pointcloudPath = "resources/pointclouds/"+data+"/cloud.js";
	loadnewpointcloud();
});
var referenceFrame = new THREE.Object3D();
function getPath(){loadnewpointcloud();}
function loadnewpointcloud(){
	if(pointcloudPath.indexOf("cloud.js") > 0){
		Potree.POCLoader.load(pointcloudPath, function(geometry){
			pointcloud = new Potree.PointCloudOctree(geometry);
			pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
			pointcloud.material.size = pointSize;
			pointcloud.visiblePointsTarget = pointCountTarget * 1000.00 * 1000.00;
			
			referenceFrame.add(pointcloud);
			
			//referenceFrame.updateMatrixWorld(true);
			//var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
			
			//referenceFrame.position.copy(sg.center).multiplyScalar(-1);
			//referenceFrame.updateMatrixWorld(true);
	
			if(firstFlipYZ)
				flipYZ();
			
			});
	}
}


var showSkybox;
var snControls;

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
		
		if(renderer !== "undefined" && renderer.pointcloud  !== "undefined"){
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
		renderer.clearDepth();
	};
};
var potreeRenderer = new PotreeRenderer();

THREE.lg_init('appname', undefined, undefined, undefined, undefined, false)
function initGUI(){}

