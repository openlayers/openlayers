/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/OWSCommon/v1.js
 */

/**
 * Class: OpenLayers.Format.OWSCommon.v1_0_0
 * Parser for OWS Common version 1.0.0.
 *
 * Inherits from:
 *  - <OpenLayers.Format.OWSCommon.v1>
 */
OpenLayers.Format.OWSCommon.v1_0_0 = OpenLayers.Class(OpenLayers.Format.OWSCommon.v1, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows",
        xlink: "http://www.w3.org/1999/xlink"
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
        "ows": OpenLayers.Util.applyDefaults({
            "ExceptionReport": function(node, obj) {
                obj.success = false;
                obj.exceptionReport = {
                    version: node.getAttribute('version'),
                    language: node.getAttribute('language'),
                    exceptions: []
                };
                this.readChildNodes(node, obj.exceptionReport);
            } 
        }, OpenLayers.Format.OWSCommon.v1.prototype.readers.ows)
    },

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "ows": OpenLayers.Format.OWSCommon.v1.prototype.writers.ows
    },
    
    CLASS_NAME: "OpenLayers.Format.OWSCommon.v1_0_0"

});
