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

// straight outta input.h
// http://lxr.free-electrons.com/source/include/linux/input.h?v=3.2

var EV_KEY = 1;
var EV_REL = 2;
var EV_ABS = 3;

var BTN_0 = 0x100;
var BTN_1 = 0x101;
var ABS_X = 0;
var ABS_Y = 1;
var ABS_Z = 2;
var ABS_RX = 3;
var ABS_RY = 4;
var ABS_RZ = 5;
var NAV_GUTTER = 20;

var buttonTimer = 0; // Alf

var relay = function( io, port, hyperlapse_delay ) {

  var multiaxis = io
      .of('/multiaxis')

  var navstate = function MultiAxisState() {
    var abs = [0,0,0,0,0,0];
    var updates = 0;

    function LogState() {
      console.log(
        'abs state:'
      + ' ABS_X: ' + abs[ABS_X]
      + ' ABS_Y: ' + abs[ABS_Y]
      + ' ABS_Z: ' + abs[ABS_Z]
      + ' ABS_RX: ' + abs[ABS_RX]
      + ' ABS_RY: ' + abs[ABS_RY]
      + ' ABS_RZ: ' + abs[ABS_RZ]
      );
    }

    function InputEvent( buf ) {
//return buf;
      var device = buf.toString( 'utf8', 16 );
      var type = buf.readUInt16LE( 8 );
      var code = buf.readUInt16LE( 10 );
      var value = buf.readInt32LE( 12 );
      if( device == 'spacenavigator' ) {
        switch( type ) {
          case EV_REL: // sometimes ABS events are sent as REL
          case EV_ABS:
            abs[code] = value;
            updates += 1;
            //LogState();
            break;
          case EV_KEY:
// buttonEvent( value ); -- send button on press, rather than press state. Start Alf
		if (value == 0) { // 0 is button released
		  clearInterval( buttonTimer );
		} else if (value == 1) { // 1 is pressed
                  buttonEvent( code ); // send id of the pressed button
		  clearInterval( buttonTimer ); // clear any existing buttonTimer intervals
		  buttonTimer = setInterval(function(){ buttonEvent( code ) }, hyperlapse_delay );
                } // End Alf

            break;
        }
      }
      return { device: device, type: type, code: code, value: value };
    }

    function FlushState() {
      var flushed = updates;
      updates = 0;
      return {
        updates: flushed,
        abs: abs
      }
    }

    // public access
    return {
      InputEvent: InputEvent,
      FlushState: FlushState
    };
  }();

  var axisevents = require('dgram').createSocket("udp4");

  function buttonEvent(value) {
    io.of('/multiaxis').emit( 'button', value );
  }

  //function sendButtonEvent( code ) {
  //          buttonEvent( code ); // send id of the pressed button
  //}

  axisevents.on('message', function (buf, rinfo) {
    var ev = navstate.InputEvent( buf );
    console.log( ev );
  });

  var axissync = setInterval( function () {
    var state = navstate.FlushState();
    if (state.updates > 0) {
      io.of('/multiaxis').emit( 'state', state );
    }
  }, 17);

  axisevents.bind(port);

  return multiaxis;
};

exports.relay = relay;

//vim:set noai
