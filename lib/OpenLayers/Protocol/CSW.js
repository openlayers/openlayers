/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
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
