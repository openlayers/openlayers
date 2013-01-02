/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol.js
 */

/**
 * Class: OpenLayers.Protocol.WCS
 * Used to create a versioned WCS protocol.  Default version is 1.0.0.
 *
 * Returns:
 * {<OpenLayers.Protocol>} A WCS protocol of the given version.
 *
 * Example:
 * (code)
 *     var protocol = new OpenLayers.Protocol.WCS({
 *         version: "1.1.0",
 *         url:  "http://demo.opengeo.org/geoserver/wcs",
 *         featureType: "tasmania_roads",
 *         featureNS: "http://www.openplans.org/topp",
 *         geometryName: "the_geom"
 *     });
 * (end)
 *
 * See the protocols for specific WCS versions for more detail.
 */
OpenLayers.Protocol.WCS = function(options) {
    options = OpenLayers.Util.applyDefaults(
        options, OpenLayers.Protocol.WCS.DEFAULTS
    );
    var cls = OpenLayers.Protocol.WCS["v"+options.version.replace(/\./g, "_")];
    if(!cls) {
        throw "Unsupported WCS version: " + options.version;
    }
    return new cls(options);
};

/**
 * Function: fromWMSLayer
 * Convenience function to create a WCS protocol from a WMS layer.  This makes
 *     the assumption that a WCS requests can be issued at the same URL as
 *     WMS requests and that a WCS featureType exists with the same name as the
 *     WMS layer.
 *     
 * This function is designed to auto-configure <url>, <featureType>,
 *     <featurePrefix> and <srsName> for WCS <version> 1.1.0. Note that
 *     srsName matching with the WMS layer will not work with WCS 1.0.0.
 * 
 * Parameters:
 * layer - {<OpenLayers.Layer.WMS>} WMS layer that has a matching WCS
 *     FeatureType at the same server url with the same typename.
 * options - {Object} Default properties to be set on the protocol.
 *
 * Returns:
 * {<OpenLayers.Protocol.WCS>}
 */
OpenLayers.Protocol.WCS.fromWMSLayer = function(layer, options) {
    var typeName, featurePrefix;
    var param = layer.params["LAYERS"];
    var parts = (OpenLayers.Util.isArray(param) ? param[0] : param).split(":");
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
    return new OpenLayers.Protocol.WCS(OpenLayers.Util.applyDefaults(
        options, protocolOptions
    ));
};

/**
 * Constant: OpenLayers.Protocol.WCS.DEFAULTS
 */
OpenLayers.Protocol.WCS.DEFAULTS = {
    "version": "1.0.0"
};