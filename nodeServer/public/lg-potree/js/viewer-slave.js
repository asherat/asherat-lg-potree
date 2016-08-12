// Create SocketIO instance, connect
var CPManager = io.connect('/manager');

// Add a connect listener
CPManager.on('connect', function () {
	console.log('Client has connected to the server!');
	CPManager.emit('getJSONfile');
});

CPManager.on('refresh', function () {
	console.log("REFRESH");
	window.location.reload(true);
});

// Add a disconnect listener
CPManager.on('disconnect', function () {
	console.log('The client has disconnected!');
});

CPManager.on('sendJSONfile', function (data, callback) {
	console.debug("New Point Cloud:", data);
	pointcloudPath = "resources/pointclouds/" + data + "/cloud.js";
	loadnewpointcloud();
});

////////////////// GUI //////////////////
var rotationAngle = sceneProperties.rotationAngle;

var elRenderArea = document.getElementById("renderArea");
var progressBar = new ProgressBar();
var showGrid;
var showSkybox;
var stats;

var pointCountTarget;
var pointSize;
var fov;

var clipMode = Potree.ClipMode.HIGHLIGHT_INSIDE;
//////////////END OF GUI //////////////////

// RENDERING
var render;
var referenceFrame = new THREE.Object3D();

var controls;

var changeEvent = function (event) {
	newPosition = event.target.object.position;
	newRotation = event.target.object.rotation;
}
var camera;
var pointcloudPath;
function getPath() {
	loadnewpointcloud();
}
function loadnewpointcloud() {
	if (pointcloudPath.indexOf("cloud.js") > 0) {
		Potree.POCLoader.load(pointcloudPath, function (geometry) {
			pointcloud = new Potree.PointCloudOctree(geometry);
			pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
			pointcloud.material.size = pointSize;
			pointcloud.visiblePointsTarget = pointCountTarget * 1000.00 * 1000.00;

			referenceFrame.add(pointcloud);
		});
	}
}

var isFlipYZ = false;
function flipYZ() {

	isFlipYZ = !isFlipYZ;

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

		if (renderer !== "undefined" && renderer.pointcloud !== "undefined") {
			if (pointcloud.originalMaterial) {
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
			var originalMaterial = pointcloud.material;{ // DEPTH PASS
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
				depthMaterial.heightMin = potreeRenderer.heightMin;
				depthMaterial.heightMax = potreeRenderer.heightMax;
				depthMaterial.uniforms.visibleNodes.value = pointcloud.material.visibleNodesTexture;
				depthMaterial.uniforms.octreeSize.value = pointcloud.pcoGeometry.boundingBox.size().x;
				depthMaterial.bbSize = pointcloud.material.bbSize;
				depthMaterial.treeType = pointcloud.material.treeType;

				scenePointCloud.overrideMaterial = depthMaterial;
				renderer.clearTarget(rtDepth, true, true, true);
				renderer.render(scenePointCloud, camera, rtDepth);
				scenePointCloud.overrideMaterial = null;
			}{ // ATTRIBUTE PASS
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
				attributeMaterial.heightMin = potreeRenderer.heightMin;
				attributeMaterial.heightMax = potreeRenderer.heightMax;
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
			}{ // NORMALIZATION PASS
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
			var originalMaterial = pointcloud.material;{ // COLOR & DEPTH PASS
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
				attributeMaterial.heightMin = potreeRenderer.heightMin;
				attributeMaterial.heightMax = potreeRenderer.heightMax;
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
			}{ // EDL OCCLUSION PASS
				edlMaterial.uniforms.screenWidth.value = width;
				edlMaterial.uniforms.screenHeight.value = height;
				edlMaterial.uniforms.near.value = camera.near;
				edlMaterial.uniforms.far.value = camera.far;
				edlMaterial.uniforms.colorMap.value = rtColor;
				edlMaterial.uniforms.expScale.value = camera.far;

				Potree.utils.screenPass.render(renderer, edlMaterial);
			}

			renderer.render(scene, camera);
			renderer.clearDepth();
		}

	}
};
var edlRenderer = new EDLRenderer();

THREE.lg_init('appname', undefined, undefined, undefined, undefined, false)

function initGUI() {
	flipYZ();
}
