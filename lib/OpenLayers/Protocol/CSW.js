/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol.js
 */

/**
 * Class: OpenLayers.Protocol.CSW
 * Used to create a versioned CSW protocol. Default version is 2.0.2.
 */
OpenLayers.Protocol.CSW = function(options) {
    options = OpenLayers.Util.applyDefaults(
        options, OpenLayers.Protocol.CSW.DEFAULTS
    );
    var cls = OpenLayers.Protocol.CSW["v"+options.version.replace(/\./g, "_")];
    if(!cls) {
        throw "Unsupported CSW version: " + options.version;
    }
    return new cls(options);
};

/**
 * Constant: OpenLayers.Protocol.CSW.DEFAULTS
 */
OpenLayers.Protocol.CSW.DEFAULTS = {
    "version": "2.0.2"
};
