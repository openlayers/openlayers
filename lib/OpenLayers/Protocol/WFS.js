/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

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
};

/**
 * Function: OpenLayers.Protocol.WFS.fromWMSLayer
 * Convenience function to create a WFS protocol from a WMS layer.  This makes
 *     the assumption that a WFS requests can be issued at the same URL as
 *     WMS requests and that a WFS featureType exists with the same name as the
 *     WMS layer.
 *     
 * This function is designed to auto-configure <url>, <featureType>,
 *     <featurePrefix> and <srsName> for WFS <version> 1.1.0. Note that
 *     srsName matching with the WMS layer will not work with WFS 1.0.0..
 * 
 * Parameters:
 * layer - {<OpenLayers.Layer.WMS>} WMS layer that has a matching WFS
 *     FeatureType at the same server url with the same typename.
 * options - {Object} Default properties to be set on the protocol.
 *
 */
OpenLayers.Protocol.WFS.fromWMSLayer = function(layer, options) {
    var typeName, featurePrefix;
    var param = layer.params["LAYERS"];
    var parts = (param instanceof Array ? param[0] : param).split(":");
    if(parts.length > 1) {
        featurePrefix = parts[0];
    }
    typeName = parts.pop();
    var protocolOptions = {
        url: layer.url,
        featureType: typeName,
        featurePrefix: featurePrefix,
        srsName: layer.projection && layer.projection.getCode() ||
                 layer.map && layer.map.getProjectionObject().getCode(),
        version: "1.1.0"
    };
    return new OpenLayers.Protocol.WFS(OpenLayers.Util.applyDefaults(
        options, protocolOptions
    ));
};

/**
 * Constant: OpenLayers.Protocol.WFS.DEFAULTS
 */
OpenLayers.Protocol.WFS.DEFAULTS = {
    "version": "1.0.0"
};
