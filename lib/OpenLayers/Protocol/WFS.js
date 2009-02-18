/**
 * @requires OpenLayers/Protocol.js
 */

/**
 * Function: OpenLayers.Protocol.WFS
 * Used to create a versioned WFS protocol.  Default version is 1.0.0.
 *
 * Returns:
 * {<OpenLayers.Protocol>} A WFS protocol of the given version.
 */
OpenLayers.Protocol.WFS = function(options) {
    options = OpenLayers.Util.applyDefaults(
        options, OpenLayers.Protocol.WFS.DEFAULTS
    );
    var cls = OpenLayers.Protocol.WFS["v"+options.version.replace(/\./g, "_")];
    if(!cls) {
        throw "Unsupported WFS version: " + options.version;
    }
    return new cls(options);
}

/**
 * Constant: OpenLayers.Protocol.WFS.DEFAULTS
 */
OpenLayers.Protocol.WFS.DEFAULTS = {
    "version": "1.0.0"
};
