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


function sendCmd($IP, $CMD, $msg, $user="lg"){

	$connection = ssh2_connect($IP, 22, array('hostkey'=>'ssh-rsa'));
	if(ssh2_auth_pubkey_file($connection, $user,
			'/opt/www-files/id_rsa.pub',
			'/opt/www-files/id_rsa')){
		
	    
		echo $msg;
	    $stream = ssh2_exec($connection, $CMD);
	    stream_set_blocking($stream, true);
	    $stream_out = ssh2_fetch_stream($stream, SSH2_STREAM_STDIO);
	    $ret_cmd = stream_get_contents($stream_out); 
	    #echo $ret_cmd; #DEBUG
	}else
		echo "Authentication Failed";
}
$NODE_HOME='/home/asherat';

if (isset($_REQUEST['initPeruse']) and ($_REQUEST['initPeruse'] != '') and isset($_REQUEST['port']) and ($_REQUEST['port'] != '')) { 
    $remote_IP = $_REQUEST['initPeruse'];

    $peruse_IP = $_SERVER[HTTP_HOST];
    $peruse_Port = $_REQUEST['port'];    

    $message = "Connecting LG at " . $remote_IP . " \n to Server at " . $peruse_IP;

    $nodeServerPath = 'nodejs '.$NODE_HOME.'/asherat666-peruse-a-rue/bin/peruse-a-rue;';
    $controllerPath = $NODE_HOME.'/bin/spacenav-emitter /dev/input/spacenavigator 127.0.0.1 8086;';

    $local_cmd = 'killall -q chromium-browser;'.'killall -q nodejs spacenav-emitter;' . $nodeServerPath;// . $controllerPath; //This is the cmd to open the nodejs server
    
    $remote_cmd = '. ${HOME}/etc/shell.conf
		lg-ctl-master

		for lg in $LG_FRAMES ; do
			frame=$(($(echo $lg | cut -c 3)-1));
			if [[ ${frame} -gt $(( ${LG_FRAMES_MAX}/2 )) ]]; then
				frame="$(( ${frame} - ${LG_FRAMES_MAX} ))";
			fi

			CMD="killall chromium-browser; export DISPLAY=:0.0 && chromium-browser '.$peruse_IP.':'.$peruse_Port.'/lg-potree/"

			if [[ $frame -ne 0 ]] ; then
				CMD=$CMD"slave.html?yawOffset="$frame;
			fi
			
			ssh -x lg@$lg "$CMD" &
		done';
	shell_exec($local_cmd);
	sendCmd($remote_IP, $remote_cmd, $message);
}elseif (isset($_REQUEST['refresh']) and ($_REQUEST['refresh'] != '')) { 
	$remote_IP = $_REQUEST['refresh'];
	$find_id='xdotool search --onlyvisible --class chromium|head -1';
	$cmd='export DISPLAY=:0.0 && xdotool windowactivate '.$find_id.' && xdotool key ctrl+F5';
	$cmd='export PATH=$PATH:$HOME/bin && lg-run "' . $cmd . '"';
	sendCmd($remote_IP, $cmd, "Refreshing");

}elseif (isset($_REQUEST['stop']) and ($_REQUEST['stop'] != '')) {
	$remote_IP = $_REQUEST['stop'];
	$cmd='killall -q node spacenav-emitter; killall -q chromium-browser';
	$cmd='export PATH=$PATH:${HOME}/bin && lg-run "' . $cmd . '"';
	sendCmd($remote_IP, $cmd, "Closing Potree");

# TOOLS
    
}elseif (isset($_REQUEST['tool']) and isset($_REQUEST['IP']) and ($_REQUEST['IP'] != '')){
	$remote_IP = $_REQUEST['IP'];	
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
