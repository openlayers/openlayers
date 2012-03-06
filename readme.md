# OpenLayers

Copyright (c) 2005-2012 OpenLayers Contributors. See authors.txt for
more details.

OpenLayers is a JavaScript library for building map applications
on the web. OpenLayers is made available under a BSD-license.
Please see license.txt in this distribution for more details.

## Getting OpenLayers

OpenLayers lives at http://www.openlayers.org/.  Find details on downloading stable releases or the development version the [development site](http://trac.osgeo.org/openlayers/wiki/HowToDownload).

## Installing OpenLayers

You can use OpenLayers as-is by copying build/OpenLayers.js and the
entire theme/ and img/ directories up to your webserver and putting them 
in the same directory. The files can be in subdirectories on your website, 
or right in the root of the site, as in these examples. 
To include the OpenLayers library in your web page from the root of the site, use:

    <script type="text/javascript" src="/OpenLayers.js" />

As an example, using bash (with the release files in ~/openlayers):

    $ cd /var/www/html
    $ cp ~/openlayers/OpenLayers.js ./
    $ cp -R ~/openlayers/theme ./
    $ cp -R ~/openlayers/img ./

If you want to use the multiple-file version of OpenLayers (for, say,
debugging or development purposes), copy the lib/ directory up to your
webserver in the same directory you put the img/ folder. Then add
the following to your web page instead:

    <script type="text/javascript" src="/lib/OpenLayers.js" />

As an example, using bash (with the release files in ~/openlayers):

    $ cd /var/www/html
    $ cp -R ~/openlayers/lib ./
    $ cp -R ~/openlayers/theme ./
    $ cp -R ~/openlayers/img ./


## Using OpenLayers in Your Own Website

The [examples directory](http://openlayers.org/dev/examples/) is full of useful examples.

Documentation is available at http://trac.osgeo.org/openlayers/wiki/Documentation.
You can generate the API documentation with http://www.naturaldocs.org/
As an example, using bash (with the release files in ~/openlayers):

    $ cd ~/openlayers/
    $ /path/to/NaturalDocs -i lib/ -o HTML doc/ -p doc_config/ -s Default OL

Information on changes in the API is available in release notes found in the notes folder.

## Contributing to OpenLayers

Please join the email lists at http://openlayers.org/mailman/listinfo
Patches are welcome!

