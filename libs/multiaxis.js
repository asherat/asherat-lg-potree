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

define(
['config', 'bigl', 'stapes', 'socketio'],
function(config, L, Stapes, io) {

	var NAV_SENSITIVITY = 0.0032;
	var NAV_GUTTER_VALUE = 8;
	var MOVEMENT_THRESHOLD = 1.0;

	var MultiAxisModule = Stapes.subclass({
constructor: function() {
			this.push_count = 0;
			this.moving = false;
		},

init: function() {
			var self = this;

			console.debug('MultiAxis: initializing');

			this.socket = io.connect('/multiaxis');

			this.socket.once('connect',function() {
				console.debug('MultiAxis: loaded');
				self.emit( 'ready' );
			});
			
			this.socket.on('connection', function (client) {
				console.debug('MultiAxis: connected')
				self.emit( 'ready' );
			})
			this.socket.on('button',function(state) {
				if (Number(state) == 0x101) self.moveForward(); 
				if (Number(state) == 0x100) self.moveBackward(); 
			});

			this.socket.on('state',function(data) {
				console.log('multiaxis abs:', data.abs);
				var xMov = 0;
				var yMov = 0;
				var zMov = 0;
				var xRot = 0;
				var yRot = 0;
				var zRot = 0;
				var value;
				var dirty = false;
				for( var axis in data.abs ) {
					value = data.abs[axis];
					switch(axis) {
					case '0': // X
						xMov = value * NAV_SENSITIVITY;
						dirty = true;
						break;
					case '1': // Y
						yMov = value * NAV_SENSITIVITY;
						dirty = true;
						break;
					case '2': // Z
						zMov = value * NAV_SENSITIVITY;
						dirty = true;
						break;
					case '3': // RX
						xRot = value * NAV_SENSITIVITY;
						dirty = true;
						break;
					case '4': // RY
						yRot = value * NAV_SENSITIVITY;
						dirty = true;
						break;
					case '5': // RZ
						zRot = value * NAV_SENSITIVITY;
						dirty = true;
						break;
					}
				}
				if (dirty) {
					self.emit('abs', {X: xMov, Y: yMov, Z: zMov, RX: xRot, RY: yRot, RZ: zRot});

				}
			});

			this.socket.on('connect_failed',function() {
				L.error('MultiAxis: connect failed!');
			});
			this.socket.on('disconnect',function() {
				L.error('MultiAxis: disconnected');
			});
			this.socket.on('reconnect',function() {
				console.debug('MultiAxis: reconnected');
			});
		},


	});

	return MultiAxisModule;
});
