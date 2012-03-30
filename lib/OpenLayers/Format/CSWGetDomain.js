/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format.js
 */

/**
 * Class: OpenLayers.Format.CSWGetDomain
 * Default version is 2.0.2.
 *
 * Returns:
 * {<OpenLayers.Format>} A CSWGetDomain format of the given version.
 */
OpenLayers.Format.CSWGetDomain = function(options) {
    options = OpenLayers.Util.applyDefaults(
        options, OpenLayers.Format.CSWGetDomain.DEFAULTS
    );
    var cls = OpenLayers.Format.CSWGetDomain["v"+options.version.replace(/\./g, "_")];
    if(!cls) {
        throw "Unsupported CSWGetDomain version: " + options.version;
    }
    return new cls(options);
};

/**
 * Constant: DEFAULTS
 * {Object} Default properties for the CSWGetDomain format.
 */
OpenLayers.Format.CSWGetDomain.DEFAULTS = {
    "version": "2.0.2"
};
