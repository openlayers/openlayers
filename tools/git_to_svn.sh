#!/bin/bash

#
# This script assumes a local clone of the openlayers github repository. This
# clone needs to be configured with an svn remote to the openlayers svn. Here
# are the actual steps to get the clone and configure it properly:
#
# $ git clone git@github.com:openlayers/openlayers.git
# $ git svn init -T trunk/openlayers -t tags/openlayers -b branches/openlayers http://svn.openlayers.org/
#
# To run this script change to the local clone first:
#
# $ cd openlayers
# $ git_to_svn.sh

git pull origin master
git svn rebase
git svn dcommit
