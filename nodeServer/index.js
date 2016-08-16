#!/usr/bin/env node
/*
 ** Copyright 2013 Google Inc.
 **
 ** Licensed under the Apache License, Version 2.0 (the "License");
 ** you may not use this file except in compliance with the License.
 ** You may obtain a copy of the License at
 **
 **    http://www.apache.org/licenses/LICENSE-2.0
 **
 ** Unless required by applicable law or agreed to in writing, software
 ** distributed under the License is distributed on an "AS IS" BASIS,
 ** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ** See the License for the specific language governing permissions and
 ** limitations under the License.
 */

module.exports.main = function () {

	var program = require('commander');
	var fs = require('fs');
	var path = require('path');
	var stylus = require('stylus');
	var connect = require('connect');
	var SocketIO = require('socket.io');
	var BigL = require('./lib/bigl');
	var ViewSync = require('./lib/viewsync');
	var MultiAxis = require('./lib/multiaxis');
	//var geRecv = require('./lib/ge_nl_rec');
	var FPS = require('./lib/fps.js');
	var CloudPointManager = require('./lib/CloudPointManager.js');

	//
	// sort out configuration/settings
	//

	// serve http from this path
	var docRoot = path.join(__dirname, 'public');
	var resRoot = path.join(docRoot, '/lg-potree/resources/pointclouds');

	// merge config files
	var config = require('./lib/config');

	// read command line args
	program
	.option('-p, --port [port]', 'Listen port [' + config.port + ']', config.port)
	.option('-u, --udp [port]', 'UDP port [' + config.udp_port + ']', config.udp_port)
	.parse(process.argv);

	var listenPort = Number(program.port);
	var udpPort = listenPort;
	if (program.udp)
		udpPort = Number(program.udp);

	//
	// start up the HTTP server
	//
	var express = require('express');
	var fileUpload = require('express-fileupload');
	var app = express();

	// default options
	app.use(fileUpload());

	app.use(stylus.middleware({
			src : docRoot,
			dest : docRoot,
			compile : function (str, path) {
				console.log('stylus: compiling new styles');
				return stylus(str)
				.set('filename', path)
				.set('compress', true)
			}
		}));
	// serve static files
	app.use(connect.static(docRoot));
	// serve the global configuration script
	app.use(config.middleware);
	// Google Earth NetworkLink handler
	//.use( geRecv.handler )
	// no url match? send a 404

	var server = app.listen(listenPort);
	app.post('/update', function (req, res) {

		var origName = req.body.origName;
		var dirName2 = req.body.dirName2;

		if (origName != dirName2) {
			console.log("Updating " + origName + " to " + dirName2);
			var oldPath = path.join(resRoot, origName);
			var newPath = path.join(resRoot, dirName2);
			if (fs.existsSync(newPath)) {
				res.status(500).send(dirName2 + " already exists!");
			} else {
				try {
					fs.renameSync(oldPath, newPath);
					res.status(200).send();
				} catch (e) {
					console.log("ERROR: Tried to rename " + oldPath + " to " + newPath + " : " + e);
					res.status(500).send(e);
				}
			}
		}

		var img2 = req.files.img2;
		if (img2.name != '') {
			if (img2.mimetype == 'image/png') {
				var destFile = path.join(resRoot, dirName2, '/preview.png');

				img2.mv(destFile, function (err) {
					if (err) {
						res.status(500).send(err);
					}
				});

			} else {
				res.send('Image is not a png');
			}
		}

	});
	app.post('/create', function (req, res) {
		var unzip = require('unzip');
		var zipFile = req.files.zipfile;
		var dirName = req.body.dirName;
		var img = req.files.img;

		var newPath = path.join(resRoot, dirName);
		if (fs.existsSync(newPath)) {
			res.status(500).send(dirName + " already exists!");
		} else {
			try {
				fs.mkdirSync(newPath);
				console.log("Creating new Point Cloud Data", dirName);
				var destFile = path.join(resRoot, dirName, '/preview.png');
				if (img.name == '') {
					console.log("Using default image");
					//fs.readFileSync()	//Copy
				} else {
					img.mv(destFile, function (err) {
						if (err) {
							res.status(500).send(err);
						}
					});
				}
				var zipDestFile = path.join(resRoot, dirName, 'zipfile.zip');
				zipFile.mv(zipDestFile, function (err) {
					fs.createReadStream(zipDestFile).pipe(unzip.Extract({
							path : path.join(resRoot, dirName)
						}));
					fs.unlink(zipDestFile);
					if (err) {
						res.status(500).send(err);
					}
				});
				res.status(200).send();
				console.log("Succesfully created", dirName);

			} catch (e) {
				console.log(e);
				res.status(500).send(e);
			}
		}
	});

	app.post('/delete', function (req, res) {

		var dirName = req.body.origName3;
		var dirPath = path.join(resRoot, dirName);

		var deleteFolderRecursive = function (path) {
			if (fs.existsSync(path)) {
				fs.readdirSync(path).forEach(function (file, index) {
					var curPath = path + "/" + file;
					if (fs.lstatSync(curPath).isDirectory()) { // recurse
						deleteFolderRecursive(curPath);
					} else { // delete file
						fs.unlinkSync(curPath);
					}
				});
				fs.rmdirSync(path);
				console.log("Successfully deleted", dirName);
			}
		};

		deleteFolderRecursive(dirPath);
		res.status(200).send();
	});
	//
	// begin socket.io
	//

	var io = SocketIO.listen(server);
	io.set('log level', 1);
	io.enable('browser client minification');

	// XXX: Socket.IO 0.9 gzip is broken in Windows
	if (!process.platform.match(/^win/))
		io.enable('browser client gzip');

	//
	// start up the client exception logger
	//

	var logger = BigL.handler(io);

	//
	// start up the viewsync app
	//

	var viewsync = ViewSync.relay(io, config);
	//geRecv.on('view_changed', function(ge) {
	//send a pano to viewsync somehow
	//});

	//
	// spacenav/multiaxis device interface
	//

	//Alf var multiaxis = MultiAxis.relay( io, config.udp_port );
	var multiaxis = MultiAxis.relay(io, config.udp_port, config.hyperlapse_delay); // Alf

	var fps = FPS.relay(io, config); //asherat
	var cpManager = CloudPointManager.relay(io, config.PointCloud); //asherat


} // exports.main

if (!module.parent) {
	module.exports.main();
}

//vim:set noai
