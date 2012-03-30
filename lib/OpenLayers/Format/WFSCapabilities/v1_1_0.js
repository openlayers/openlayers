/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WFSCapabilities/v1.js
 * @requires OpenLayers/Format/OWSCommon/v1.js
 */

/**
 * Class: OpenLayers.Format.WFSCapabilities/v1_1_0
 * Read WFS Capabilities version 1.1.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WFSCapabilities>
 */
OpenLayers.Format.WFSCapabilities.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.WFSCapabilities.v1, {

    /**
     * Property: regExes
     * Compiled regular expressions for manipulating strings.
     */
    regExes: {
        trimSpace: (/^\s*|\s*$/g),
        removeSpace: (/\s*/g),
        splitSpace: (/\s+/),
        trimComma: (/\s*,\s*/g)
    },
    
    /**
     * Constructor: OpenLayers.Format.WFSCapabilities.v1_1_0
     * Create a new parser for WFS capabilities version 1.1.0.
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
        "wfs": OpenLayers.Util.applyDefaults({
            "DefaultSRS": function(node, obj) {
                var defaultSRS = this.getChildValue(node);
                if (defaultSRS) {
                    obj.srs = defaultSRS;
                }
            }
        }, OpenLayers.Format.WFSCapabilities.v1.prototype.readers["wfs"]),
        "ows": OpenLayers.Format.OWSCommon.v1.prototype.readers.ows
    },

    CLASS_NAME: "OpenLayers.Format.WFSCapabilities.v1_1_0" 

});
