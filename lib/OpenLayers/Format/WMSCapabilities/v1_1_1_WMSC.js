/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities/v1_1_1.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities/v1_1_1_WMSC
 * Read WMS-C Capabilities version 1.1.1.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMSCapabilities.v1_1_1>
 */
OpenLayers.Format.WMSCapabilities.v1_1_1_WMSC = OpenLayers.Class(
    OpenLayers.Format.WMSCapabilities.v1_1_1, {
    
    /**
     * Property: version
     * {String} The specific parser version.
     */
    version: "1.1.1",
    
    /**
     * Property: profile
     * {String} The specific profile
     */
    profile: "WMSC",
    
    /**
     * Constructor: OpenLayers.Format.WMSCapabilities.v1_1_1
     * Create a new parser for WMS-C capabilities version 1.1.1.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.WMSCapabilities.v1_1_1.prototype.initialize.apply(
            this, [options]
        );
    },

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "wms": OpenLayers.Util.applyDefaults({
            "VendorSpecificCapabilities": function(node, obj) {
                obj.vendorSpecific = {tileSets: []};
                this.readChildNodes(node, obj.vendorSpecific);
            },
            "TileSet": function(node, vendorSpecific) {
                var tileset = {srs: {}, bbox: {}, resolutions: []};
                this.readChildNodes(node, tileset);
                vendorSpecific.tileSets.push(tileset);
            },
            "Resolutions": function(node, tileset) {
                var res = this.getChildValue(node).split(" ");
                for (var i=0, len=res.length; i<len; i++) {
                    if (res[i] != "") {
                        tileset.resolutions.push(parseFloat(res[i]));
                    }
                }
            },
            "Width": function(node, tileset) {
                tileset.width = parseInt(this.getChildValue(node));
            },
            "Height": function(node, tileset) {
                tileset.height = parseInt(this.getChildValue(node));
            },
            "Layers": function(node, tileset) {
                tileset.layers = this.getChildValue(node);
            },
            "Styles": function(node, tileset) {
                tileset.styles = this.getChildValue(node);
            }
        }, OpenLayers.Format.WMSCapabilities.v1_1_1.prototype.readers["wms"])
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1_1_WMSC" 

});
