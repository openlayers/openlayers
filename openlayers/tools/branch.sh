#!/bin/sh

RELEASE=$1

svn copy -m "Branching for the $RELEASE release" http://svn.openlayers.org/trunk/openlayers http://svn.openlayers.org/branches/openlayers/$RELEASE
