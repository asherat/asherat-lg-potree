#!/bin/bash

####Declaring config variables######
nodePath="$HOME/asherat666-peruse-a-rue";
potreePath="$HOME/asherat666-lg-potree"

log_file="mylog.log";
cat /dev/null > $log_file;
##################################

if [[ $(/usr/bin/id -u) -ne 0 ]] ; then
    echo "Not running as root";
    exit;
fi

separator="----------------------------------------";

#Compile the spacenav-emitter driver
echo -ne "\nCompiling controller driver ... ";
gcc -m32 -o $potreePath/nodeServer/bin/spacenav-emitter $potreePath/nodeServer/spacenav-emitter.c >> $log_file 2>&1 && \
echo "COMPLETED";

#Moving php-interface to apache
echo -ne "\nCopying php-interface ... ";
web_path="/var/www/";
if [ -d "/var/www/html" ] ; then
  web_path=$webpath"html/";
fi
sudo cp $potreePath/php-interface/* $web_path >> $log_file 2>&1 && \
echo "COMPLETED";

#Moving lg-potree files to the node server
echo -ne "\nCopying Potree Files ... ";
yes | cp -rf $potreePath/* $nodePath >> $log_file 2>&1 && \
echo "COMPLETED";


echo $separator;
echo "Completed Update, you can check the log file at $log_file";
