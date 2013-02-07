/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMSCapabilities/v1_1.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities/v1_1_1
 * Read WMS Capabilities version 1.1.1.
 *
 * Note on <ScaleHint> parsing: If the 'min' attribute is set to "0", no
 * maxScale will be set on the layer object. If the 'max' attribute is set to
 * "Infinity", no minScale will be set. This makes it easy to create proper
 * {<OpenLayers.Layer.WMS>} configurations directly from the layer object
 * literals returned by this format, because no minScale/maxScale modifications
 * need to be made.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMSCapabilities.v1_1>
 */
OpenLayers.Format.WMSCapabilities.v1_1_1 = OpenLayers.Class(
    OpenLayers.Format.WMSCapabilities.v1_1, {
    
    /**
     * Property: version
     * {String} The specific parser version.
     */
    version: "1.1.1",
    
    /**
     * Constructor: OpenLayers.Format.WMSCapabilities.v1_1_1
     * Create a new parser for WMS capabilities version 1.1.1.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

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
                obj.srs[this.getChildValue(node)] = true;
            }
        }, OpenLayers.Format.WMSCapabilities.v1_1.prototype.readers["wms"])
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1_1" 

});
