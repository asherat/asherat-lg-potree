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

$connection = ssh2_connect('lg1', 22);
ssh2_auth_password($connection, 'lg', 'lqgalaxy');

if (isset($_REQUEST['initPeruse']) and ($_REQUEST['initPeruse'] != '') and isset($_REQUEST['port']) and ($_REQUEST['port'] != '')) { 
        $var1 = "Connecting to: " . $_REQUEST['initPeruse'] . ":" . $_REQUEST['port'];
        $var2 = $_REQUEST['initPeruse'] . " " . $_REQUEST['port'];

        echo "$var1"; 
        $stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && lg-potree '. $var2);


}elseif (isset($_REQUEST['query']) and ($_REQUEST['query'] == 'relaunch')) {
    echo "Relaunching";
    $stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && lg-relaunch');
    #exec('/usr/bin/sudo -H -u lg /home/lg/bin/lg-relaunch');   
}elseif (isset($_REQUEST['query']) and ($_REQUEST['query'] == 'reboot')) {
    echo "Rebooting";
    $stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && lg-reboot');
    #exec('/usr/bin/sudo -H -u lg /home/lg/bin/lg-sudo reboot');
}elseif (isset($_REQUEST['query']) and ($_REQUEST['query'] == 'shutdown')) {
    echo "Shutting Down";
    $stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && lg-sudo \'shutdown -h 0 \'');
    #exec('/usr/bin/sudo -H -u lg /home/lg/bin/lg-sudo \'shutdown -h 0\'');



}elseif (isset($_REQUEST['stop'])) {
    echo "Closing Potree";
    $stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && lg-potree-stop');
    #exec('/usr/bin/sudo -H -u lg /home/lg/bin/lg-potree-stop');
}elseif (isset($_REQUEST['refresh'])){
	echo "Refreshing";
	$stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && browser-refresh');
	#shell_exec('/usr/bin/sudo -H -u lg /home/lg/bin/browser-refresh');
}elseif (isset($_REQUEST['multiaxis']) and ($_REQUEST['multiaxis']) and isset($_REQUEST['port']) and ($_REQUEST['port'] != '') ){
	#echo "Connecting SpaceNavigator";
    $varDevice = '/dev/input/spacenavigator';
    $varIP = $_REQUEST['multiaxis'];
    $varPort = $_REQUEST['port'];
	$stream = ssh2_exec($connection, 'export PATH=$PATH:/home/lg/bin && spacenav-emitter '. $varDevice .' '. $varIP .' '. $varPort);
}



if(isset($stream)){
    stream_set_blocking($stream, true);
    $stream_out = ssh2_fetch_stream($stream, SSH2_STREAM_STDIO);
    stream_get_contents($stream_out); 
}

?>
