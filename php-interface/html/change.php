<?php
# Copyright 2010 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

$node_path = "/home/lg";
function sendCmd($IP, $CMD, $msg, $user="lg"){

	$connection = ssh2_connect($IP, 22, array('hostkey'=>'ssh-rsa'));
	if($connection){
		if(ssh2_auth_pubkey_file($connection, $user,
				'/opt/www-files/id_rsa.pub',
				'/opt/www-files/id_rsa')){
			echo $msg;
			$stream = ssh2_exec($connection, $CMD);
			stream_set_blocking($stream, true);
			$stream_out = ssh2_fetch_stream($stream, SSH2_STREAM_STDIO);
			$ret_cmd = stream_get_contents($stream_out);
			//echo $ret_cmd; //DEBUG
		}else
			echo "Authentication Failed";
	}else
		echo "Couldn't connect";

}

function sendKey($IP, $key, $msg, $user="lg"){
	$find_id='xdotool search --onlyvisible --class chromium|head -1';
	$cmd='export DISPLAY=:0.0 && xdotool windowactivate '.$find_id.' && xdotool key '.$key;
	$cmd='export PATH=$PATH:$HOME/bin && lg-run "' . $cmd . '"';
	sendCmd($IP, $cmd, $msg);
}

if (isset($_REQUEST['initPeruse']) and ($_REQUEST['initPeruse'] != '') 
and isset ($_REQUEST['nodeIP']) and ($_REQUEST['nodeIP'])
and isset($_REQUEST['nodePort']) and ($_REQUEST['nodePort'] != '')) { 
    $remote_IP = $_REQUEST['initPeruse'];

    $peruse_IP = trim($_REQUEST['nodeIP']);
    $peruse_Port = $_REQUEST['nodePort'];

    $message = "Connecting LG at " . $remote_IP . " \n to Server at " . $peruse_IP.":".$peruse_Port;

    $nodeServerPath = 'nodejs '.$node_path.'/asherat666-peruse-a-rue/bin/peruse-a-rue';
    $controllerPath = $node_path.'/asherat666-peruse-a-rue/bin/spacenav-emitter /dev/input/spacenavigator 127.0.0.1 '.$peruse_Port;
    $local_cmd = 'killall -q chromium-browser node spacenav-emitter';

    $remote_cmd = '. ${HOME}/etc/shell.conf;
		for lg in $LG_FRAMES ; do
			frame="$(($(echo $lg | cut -c 3)-1))";
			if [[ ${frame} -gt $(( ${LG_FRAMES_MAX}/2 )) ]]; then
				frame="$(( ${frame} - ${LG_FRAMES_MAX} ))";
			fi

			CMD="killall chromium-browser; export DISPLAY=:0.0 && chromium-browser --start-fullscreen \"'.$peruse_IP.':'.$peruse_Port.'/lg-potree/"
			if [[ $frame -ne 0 ]] ; then
				CMD=$CMD"slave.html?yawOffset="$frame;
			fi
			CMD=$CMD"\" &";
			ssh -x lg@$lg "$CMD" &
		done
		';
		
	shell_exec($local_cmd."  > /dev/null 2>/dev/null &");
	shell_exec($nodeServerPath." > /dev/null 2>/dev/null &");
	shell_exec($controllerPath." > /dev/null 2>/dev/null &");
	sendCmd($remote_IP, $remote_cmd, $message);
}elseif (isset($_REQUEST['refresh']) and ($_REQUEST['refresh'] != '')) { 
	$remote_IP = $_REQUEST['refresh'];
	sendKey($remote_IP, "ctrl+F5", "Refreshing");

}elseif (isset($_REQUEST['fullscreen']) and ($_REQUEST['fullscreen'] != '')) { 
	$remote_IP = $_REQUEST['refresh'];
	sendKey($remote_IP, "F11", "Refreshing");

}elseif (isset($_REQUEST['stop']) and ($_REQUEST['stop'] != '')) {
	$remote_IP = $_REQUEST['stop'];

	$local_cmd='killall -q node spacenav-emitter';
	shell_exec($local_cmd." > /dev/null 2>/dev/null &");

	$cmd='killall -q node spacenav-emitter -q chromium-browser';
	$cmd='export PATH=$PATH:${HOME}/bin && lg-run "' . $cmd . '"';
	sendCmd($remote_IP, $cmd, "Closing Potree");

# TOOLS

}elseif (isset($_REQUEST['tool']) and isset($_REQUEST['lgIP']) and ($_REQUEST['lgIP'] != '')){
	$remote_IP = $_REQUEST['lgIP'];
	if ($_REQUEST['tool'] == 'relaunch') {
   		$cmd='export PATH=$PATH:${HOME}/bin && lg-relaunch';
		sendCmd($remote_IP, $cmd, "Relaunching");
	}elseif ($_REQUEST['tool'] == 'reboot'){
  		$cmd='export PATH=$PATH:${HOME}/bin && lg-sudo reboot';
		sendCmd($remote_IP, $cmd, "Rebooting");
	}elseif($_REQUEST['tool'] == 'shutdown'){
    		$cmd = 'export PATH=$PATH:${HOME}/bin && lg-sudo \'shutdown -h 0 \'';
    		sendCmd($remote_IP, $cmd, "Shutting Down");
	}
}

?>
