/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format.js
 */

/**
 * Class: OpenLayers.Format.CSWGetRecords
 * Default version is 2.0.2.
 *
 * Returns:
 * {<OpenLayers.Format>} A CSWGetRecords format of the given version.
 */
OpenLayers.Format.CSWGetRecords = function(options) {
    options = OpenLayers.Util.applyDefaults(
        options, OpenLayers.Format.CSWGetRecords.DEFAULTS
    );
    var cls = OpenLayers.Format.CSWGetRecords["v"+options.version.replace(/\./g, "_")];
    if(!cls) {
        throw "Unsupported CSWGetRecords version: " + options.version;
    }
    return new cls(options);
};

/**
 * Constant: DEFAULTS
 * {Object} Default properties for the CSWGetRecords format.
 */
OpenLayers.Format.CSWGetRecords.DEFAULTS = {
    "version": "2.0.2"
};
