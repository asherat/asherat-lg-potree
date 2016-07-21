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



if (isset($_REQUEST['initPeruse']) and ($_REQUEST['initPeruse'] != '') and isset($_REQUEST['port']) and ($_REQUEST['port'] != '')) { 
    $HOME='/home/lg';
    $remote_IP = $_REQUEST['initPeruse'];
    $remote_Port = $_REQUEST['port'];    
    $localIP = gethostbyname(trim(`hostname`));
    $login = 'lg';
    $password = 'lqgalaxy';

    $message = "Connecting LG at " . $remote_IP . ":" . $remote_Port . "\n to Server at" . $localIP;

    $nodeServerPath = $HOME.'/asherat666-peruse-a-rue/bin/peruse-a-rue;';
    $controllerPath = $HOME.'/bin/spacenav-emitter /dev/input/spacenavigator 127.0.0.1 8086;';
    $local_cmd = 'killall -q node spacenav-emitter;' . $nodeServerPath . $controllerPath; //This is the cmd to open the nodejs server
    $asd=shell_exec($local_cmd);
        echo $asd;
    
    $remote_cmd = 'export DISPLAY=:0.0;
    . ${HOME}/etc/shell.conf;
    myFrame=$(cat ${HOME}/frame);
    myCmd="chromium-browser '. $localIP .':8086/lg-potree/";

    if [[ ${myFrame} -ne 0 ]]; then
        if [[ ${myFrame} -gt $(( ${LG_FRAMES_MAX}/2 )) ]] ; then
            myFrame=$(( ${myFrame} - ${LG_FRAMES_MAX} ));
        fi
        myCmd=$myCmd"slave.html?yawOffset="$myFrame;
    fi
    
    $myCmd;
    '; //This is the cmd that the LG will receive to connect to the nodejs server

    
    $connection = ssh2_connect($remote_IP, 22);
    ssh2_auth_password($connection, $login, $password);

    sendCmd($connection, 'export PATH=$PATH:/home/lg/bin && lg-run \'' . $remote_cmd . '\'');

    echo $message;

}elseif (isset($_REQUEST['refresh']) and ($_REQUEST['refresh'] != '')) { 
    echo "Refreshing";
    $remote_IP = $_REQUEST['refresh'];
    $login = 'lg';
    $password = 'lqgalaxy';
    $connection = ssh2_connect($remote_IP, 22);
    ssh2_auth_password($connection, $login, $password);

    $find_id='$(xdotool search --onlyvisible --class chromium|head -1)';
    $cmd='export DISPLAY=:0.0 && xdotool windowactivate '.$find_id.' && xdotool key ctrl+F5';
    sendCmd($connection, 'export PATH=$PATH:/home/lg/bin && lg-run \'' . $cmd . '\'');

}elseif (isset($_REQUEST['stop']) and ($_REQUEST['stop'] != '')) {
    echo "Closing Potree";

    $remote_IP = $_REQUEST['stop'];
    $login = 'lg';
    $password = 'lqgalaxy';
    $connection = ssh2_connect($remote_IP, 22);
    ssh2_auth_password($connection, $login, $password);

    $cmd='export DISPLAY=:0.0 && killall -q node spacenav-emitter; killall -q chromium-browser';
    echo sendCmd($connection, 'export PATH=$PATH:/home/lg/bin && lg-run \'' . $cmd . '\'');

# TOOLS
    
}elseif (isset($_REQUEST['query']) and ($_REQUEST['query'] == 'relaunch')) {
    echo "Relaunching";
    $cmd='export PATH=$PATH:/home/lg/bin && lg-relaunch';
    sendCmd($connection, $cmd)
}elseif (isset($_REQUEST['query']) and ($_REQUEST['query'] == 'reboot')) {
    echo "Rebooting";
    sendCmd($connection, $cmd)
    $cmd='export PATH=$PATH:/home/lg/bin && lg-reboot';
}elseif (isset($_REQUEST['query']) and ($_REQUEST['query'] == 'shutdown')) {
    echo "Shutting Down";
    $cmd = 'export PATH=$PATH:/home/lg/bin && lg-sudo \'shutdown -h 0 \'';
    sendCmd($connection, $cmd)
}


function sendCmd($conn, $cmd){
    $stream = ssh2_exec($conn, $cmd);
    stream_set_blocking($stream, true);
    $stream_out = ssh2_fetch_stream($stream, SSH2_STREAM_STDIO);
    $ret_cmd = stream_get_contents($stream_out); 
    return $ret_cmd;
}

?>
