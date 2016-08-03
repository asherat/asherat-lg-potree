#!/bin/bash

####Declaring config variables######
nodePath="$HOME/asherat666-peruse-a-rue";

log_file="mylog.log";
cat /dev/null > $log_file;
##################################

if [[ $(/usr/bin/id -u) -ne 0 ]]; then
    echo "Not running as root";
    exit;
fi

usage="USAGE:$0 [UserInput(true,false)] ([LG_IP] [LG_USER] [LG_PASSWORD] IGNORED if UserInput = true)"

if [ -z $1 || ( [ $1 !=  "true" ] && ( [ $1 != "false" ] && [ $# -ne 4 ] ) ) ; then
  echo $usage;
  exit 2;
fi

user_input=$1;
#user_input=false;

#Install all necessary packages
echo "Installing packages";
sudo apt-get -y install nodejs ssh php5 apache2 libssh2-php gcc-multilib sshpass >> $log_file;

#Restart apache to load libssh2-php
echo "Restarting apache";
sudo service apache2 restart & >> $log_file;

#Compile the spacenav-emitter driver
echo "Compiling controller driver";
gcc -m32 -o nodeServer/spacenav-emitter nodeServerh/spacenav-emitter.c >> $log_file;

#Moving php-interface to apache
echo "Copying php-interface";
web_path="/var/www/";
if [ -d "/var/www/html" ] ; then
  web_path=$webpath"html/";
fi
sudo cp php-interface/* $web_path >> $log_file;

#Moving lg-potree files to the node server
echo "Copying Potree Files";
yes | cp -rf * $nodePath >> $log_file;

#Create new ssh keys and make a duplicate for www-data
echo "Creating ssh keys";
ssh-keygen -t rsa -f $home/.ssh/id_rsa -q -P "" >> $log_file;
echo "Moving keys and giving access to web user";
sudo mkdir /opt/www-files >> $log_file;
sudo chown www-data:www-data /opt/www-files >> $log_file;
sudo chown www-data:www-data /opt/www-files/* >> $log_file;

#Copy the ssh keys to the Liquid Galaxy
echo "Adquiring access to Liquid Galaxy";
if [ $user_input ] ; then
  echo "Type the IP of the remote Liquid Galaxy, followed by [ENTER]:"
  read $lg_IP
  echo "Type the username of the Liquid Galaxy, followed by [ENTER]:"
  read $lg_user
  echo "Type the password of the Liquid Galaxy, followed by [ENTER]:"
  read -s $lg_password
else
  $lg_IP=$2;
  $lg_user=$3;
  $lg_password=$4;
fi
sshpass -p $lg_password ssh-copy-id $lg_user@$lg_IP >> $log_file;

echo "Completed Installation, you can check the log file at $log_file";
