/* Copyright 2010 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

window.onload = function (e) {
  var evt = e || window.event;
  var imgs;
  if (evt.preventDefault) {
    imgs = document.getElementsByTagName('img');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].onmousedown = disableDragging;
    }
  }
}
function disableDragging(e) {
  e.preventDefault();
}


function createRequest() {
  if (window.XMLHttpRequest) {
    var req = new XMLHttpRequest();
    return req;
  }
}
function submitRequest(url) {
  var req = createRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      if (req.status == 200) {
	document.getElementById('status').innerHTML = req.responseText;
      }
    }
  }
  req.open('GET', url, true);
  req.send(null);
}
function sendQuery(query) {
  submitRequest('change.php?query=' + query);
  showAndHideStatus();
}
function showAndHideStatus() {
  var status = document.getElementById('status');
  status.style.opacity = 1;
  window.setTimeout('document.getElementById("status").style.opacity = 0;', 5000);
}

function initPeruse() {
  var myIp = document.getElementById('myIP').value;
  var myPort = document.getElementById('myPORT').value;
  submitRequest('change.php?initPeruse=' + myIp + '&port=' + myPort);
  showAndHideStatus();
}

function openManager(){
  var myIP = window.location.host;
  //var myIp = document.getElementById('myIP').value;
  var myPORT = document.getElementById('myPORT').value;
  var url = 'http://' + myIP +':'+ myPORT +'/lg-potree/manager';
  var win = window.open(url, '_blank');
  win.focus();
}

function RefreshBrowsers() {
  var myIp = document.getElementById('myIP').value;
  submitRequest('change.php?refresh=' + myIp);
  showAndHideStatus();
}
function stopAll() {
  var myIp = document.getElementById('myIP').value;  
  submitRequest('change.php?stop=' + myIp);
  showAndHideStatus();
}

function toolRequest(query) {
  var myIp = document.getElementById('myIP').value;
  submitRequest('change.php?tool=' + query + '&IP=' + myIp);
  showAndHideStatus();
}


