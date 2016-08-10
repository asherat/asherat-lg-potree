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

		var NAV_SENSITIVITY = 10;
		var NAV_ZERO_VALUE = 14;
		var NAV_MAX_VALUE = 350;

		var MultiAxisModule = Stapes.subclass({

			init: function() {
				var self = this;

				console.debug('MultiAxis: initializing');

				this.socket = io.connect('/multiaxis');

				this.socket.once('connect',function() {
					console.debug('MultiAxis: loaded');
				});

				this.socket.once('connection', function () {
					console.debug('MultiAxis: connected')
					self.emit( 'ready' );
				})
				this.socket.on('button',function(state) {
					//console.debug(state);
					if (Number(state) == 0x101) self.raiseSpeed(); 
					if (Number(state) == 0x100) self.lowerSpeed(); 
				});

				this.socket.on('state',function(data) {
				//console.log('multiaxis abs:', data.abs);
				var xMov = 0;
				var yMov = 0;
				var zMov = 0;
				var xRot = 0;
				var yRot = 0;
				var zRot = 0;
				var dirty = false;
				var ret = [0,0,0,0,0,0];
				for (var axis in data.abs) {
					value = data.abs[axis];
					if ( Math.abs(value) > NAV_ZERO_VALUE){
						value = value * NAV_SENSITIVITY / NAV_MAX_VALUE; 
						ret[axis] = value;
						dirty = true;
					}
				}

			if (dirty) {
				self.emit('abs', {X:ret[0], Z:ret[1], Y:ret[2], RX:ret[3], RZ:ret[4], RY:ret[5] } );
			}
		});
				this.socket.on('reset', function(){
					self.emit( 'reset' );
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
			raiseSpeed: function() {
				this.emit('raiseSpeed');
			},
			lowerSpeed: function() {
				this.emit('lowerSpeed');
			},

		});

		return MultiAxisModule;
	});
