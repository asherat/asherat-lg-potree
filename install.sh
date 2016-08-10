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
usage="USAGE:$0 [UserInput(true,false)] ([LG_IP] [LG_USER] [LG_PASSWORD] IGNORED if UserInput = true)"

if [[ ! ( $1 && ( $1 == "true" || ( $1 == "false" && $# -eq 4 ) ) ) ]] ; then
  echo $usage;
  exit 2;
fi

user_input=$1;

echo $separator;
#Install all necessary packages
echo -ne "Installing packages ... ";
sudo apt-get -y install nodejs ssh php apache2 php-ssh2 gcc-multilib sshpass >> $log_file 2>&1 && \
echo "COMPLETED";

#Restart apache to load libssh2-php
echo -ne "\nRestarting apache ... ";
sudo service apache2 restart >> $log_file 2>&1 && \
echo "COMPLETED";

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
sudo cp $potreePath/php-interface/html/* $web_path >> $log_file 2>&1 && \
echo "COMPLETED";

#Moving lg-potree files to the node server
echo -ne "\nCopying Potree Files ... ";
yes | cp -rf $potreePath/* $nodePath >> $log_file 2>&1 && \
echo "COMPLETED";

#Installing necessary node dependencies
echo -ne "\nInstalling Node dependencies ... ";
cd $nodePath && npm install unzip express-fileupload express && cd .. >> $log_file 2>&1 && \
echo "COMPLETED";

#Create new ssh keys and make a duplicate for www-data
if [[ -f /opt/www-files/*id_rsa && -f /opt/www-files/*id_rsa.pub ]]; then
	echo -e "\nUsing already existing SSH Keys";
else
	if [[ -f $HOME/.ssh/*id_rsa && -f $HOME/.ssh/*id_rsa.pub ]] ; then
		echo -ne "\nCopying already existing SSH Keys";
	else
		echo -ne "\nCreating ssh keys ... ";
		ssh-keygen -t rsa -f $HOME/.ssh/id_rsa -q -P "" >> $log_file 2>&1 && \
		echo "COMPLETED";
	fi
	echo -ne "\nMoving keys and giving access to web user ... ";
	sudo mkdir /opt/www-files >> $log_file 2>&1 \
	sudo cp $HOME/.ssh/*id_rsa* /opt/www-files >> $log_file 2>&1 && \
	sudo chown www-data:www-data /opt/www-files >> $log_file 2>&1 && \
	sudo chown www-data:www-data /opt/www-files/* >> $log_file 2>&1 && \
	echo "COMPLETED";
fi


#Copy the ssh keys to the Liquid Galaxy
if [ $user_input == "true" ] ; then
  echo $separator;
  echo "Type the IP of the remote Liquid Galaxy, followed by [ENTER]:"
  read lg_IP
  echo "Type the username of the Liquid Galaxy, followed by [ENTER]:"
  read lg_user
  echo "Type the password of the Liquid Galaxy, followed by [ENTER]:"
  read -s lg_password
else
  lg_IP=$2;
  lg_user=$3;
  lg_password=$4;
fi
echo -ne "\nAdquiring access to Liquid Galaxy at $lg_IP:$lg_user ... ";
sshpass -p $lg_password ssh-copy-id $lg_user"@"$lg_IP >> $log_file 2>&1 && \
echo "COMPLETED";

echo $separator;
echo "Completed Installation, you can check the log file at $log_file";
