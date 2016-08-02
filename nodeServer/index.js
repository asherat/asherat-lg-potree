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

module.exports.main = function() {

  var program = require('commander');
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

  // merge config files
  var config = require('./lib/config');

  // read command line args
  program
    .option( '-p, --port [port]', 'Listen port ['+config.port+']', config.port )
    .option( '-u, --udp [port]', 'UDP port ['+config.udp_port+']', config.udp_port )
    .parse( process.argv );

  var listenPort = Number(program.port);
  var udpPort = listenPort;
  if( program.udp ) udpPort = Number(program.udp);

  //
  // start up the HTTP server
  //

  var app = connect()
      // compile stylesheets on demand
      .use( stylus.middleware({
        src: docRoot,
        dest: docRoot,
        compile: function(str, path) {
          console.log('stylus: compiling new styles');
          return stylus(str)
          .set('filename', path)
          .set('compress', true)
        }
      }))
      // serve static files
      .use( connect.static( docRoot ) )
      // serve the global configuration script
      .use( config.middleware )
      // Google Earth NetworkLink handler
      //.use( geRecv.handler )
      // no url match? send a 404
      .use( function( req, res ) {
        res.statusCode = 404;
        res.end('<h1>404</h1>');
      })
      .listen( listenPort );

  //
  // begin socket.io
  //

  var io = SocketIO.listen(app);
  io.set( 'log level', 1 );
  io.enable( 'browser client minification' );

  // XXX: Socket.IO 0.9 gzip is broken in Windows
  if (!process.platform.match(/^win/))
    io.enable( 'browser client gzip' );

  //
  // start up the client exception logger
  //

  var logger = BigL.handler(io);

  //
  // start up the viewsync app
  //

  var viewsync = ViewSync.relay( io, config );
  //geRecv.on('view_changed', function(ge) {
    //send a pano to viewsync somehow
  //});

  //
  // spacenav/multiaxis device interface
  //

  //Alf var multiaxis = MultiAxis.relay( io, config.udp_port ); 
  var multiaxis = MultiAxis.relay( io, config.udp_port, config.hyperlapse_delay ); // Alf

  var fps = FPS.relay( io, config); //asherat
  var cpManager = CloudPointManager.relay( io, config.PointCloud); //asherat


} // exports.main

if (!module.parent) {
  module.exports.main();
}

//vim:set noai
