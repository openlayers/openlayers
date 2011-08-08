/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol/WFS/v1.js
 * @requires OpenLayers/Format/WFST/v1_1_0.js
 */

/**
 * Class: OpenLayers.Protocol.WFS.v1_1_0
 * A WFS v1.1.0 protocol for vector layers.  Create a new instance with the
 *     <OpenLayers.Protocol.WFS.v1_1_0> constructor.
 *
 * Differences from the v1.0.0 protocol:
 *  - uses Filter Encoding 1.1.0 instead of 1.0.0
 *  - uses GML 3 instead of 2 if no format is provided
 *  
 * Inherits from:
 *  - <OpenLayers.Protocol.WFS.v1>
 */
OpenLayers.Protocol.WFS.v1_1_0 = OpenLayers.Class(OpenLayers.Protocol.WFS.v1, {
    
    /**
     * Property: version
     * {String} WFS version number.
     */
    version: "1.1.0",
    
    /**
     * Constructor: OpenLayers.Protocol.WFS.v1_1_0
     * A class for giving layers WFS v1.1.0 protocol.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options properties:
     * featureType - {String} Local (without prefix) feature typeName (required).
     * featureNS - {String} Feature namespace (optional).
     * featurePrefix - {String} Feature namespace alias (optional - only used
     *     if featureNS is provided).  Default is 'feature'.
     * geometryName - {String} Name of geometry attribute.  Default is 'the_geom'.
     * outputFormat - {String} Optional output format to use for WFS GetFeature
     *     requests. This can be any format advertized by the WFS's
     *     GetCapabilities response. If set, an appropriate readFormat also
     *     has to be provided, unless outputFormat is GML3, GML2 or JSON.
     * readFormat - {<OpenLayers.Format>} An appropriate format parser if
     *     outputFormat is none of GML3, GML2 or JSON.
     */
    initialize: function(options) {
        OpenLayers.Protocol.WFS.v1.prototype.initialize.apply(this, arguments);
        if (this.outputFormat && !this.readFormat) {
            if (this.outputFormat.toLowerCase() == "gml2") {
                this.readFormat = new OpenLayers.Format.GML.v2({
                    featureType: this.featureType,
                    featureNS: this.featureNS,
                    geometryName: this.geometryName
                });
            } else if (this.outputFormat.toLowerCase() == "json") {
                this.readFormat = new OpenLayers.Format.GeoJSON();
            }
        }
    },
   
    CLASS_NAME: "OpenLayers.Protocol.WFS.v1_1_0"
});
