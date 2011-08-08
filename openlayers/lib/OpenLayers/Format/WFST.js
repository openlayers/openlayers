/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format.js
 */

/**
 * Function: OpenLayers.Format.WFST
 * Used to create a versioned WFS protocol.  Default version is 1.0.0.
 *
 * Returns:
 * {<OpenLayers.Format>} A WFST format of the given version.
 */
OpenLayers.Format.WFST = function(options) {
    options = OpenLayers.Util.applyDefaults(
        options, OpenLayers.Format.WFST.DEFAULTS
    );
    var cls = OpenLayers.Format.WFST["v"+options.version.replace(/\./g, "_")];
    if(!cls) {
        throw "Unsupported WFST version: " + options.version;
    }
    return new cls(options);
};

/**
 * Constant: OpenLayers.Format.WFST.DEFAULTS
 * {Object} Default properties for the WFST format.
 */
OpenLayers.Format.WFST.DEFAULTS = {
    "version": "1.0.0"
};
