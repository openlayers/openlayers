/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities/v1_1.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities/v1_1_0
 * Read WMS Capabilities version 1.1.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMSCapabilities.v1_1>
 */
OpenLayers.Format.WMSCapabilities.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.WMSCapabilities.v1_1, {
    
    /**
     * Property: version
     * {String} The specific parser version.
     */
    version: "1.1.0",
    
    /**
     * Constructor: OpenLayers.Format.WMSCapabilities.v1_1_0
     * Create a new parser for WMS capabilities version 1.1.0.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.WMSCapabilities.v1_1.prototype.initialize.apply(
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
            "SRS": function(node, obj) {
                var srs = this.getChildValue(node);
                var values = srs.split(/ +/);
                for (var i=0, len=values.length; i<len; i++) {
                    obj.srs[values[i]] = true;
                }
            }
        }, OpenLayers.Format.WMSCapabilities.v1_1.prototype.readers["wms"])
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1_0" 

});
