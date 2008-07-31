/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/Filter/v1.js
 */

/**
 * Class: OpenLayers.Format.Filter.v1_0_0
 * Write ogc:Filter version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.Filter.v1>
 */
OpenLayers.Format.Filter.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.Filter.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.0.0
     */
    VERSION: "1.0.0",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/ogc/filter/1.0.0/filter.xsd
     */
    schemaLocation: "http://www.opengis.net/ogc/filter/1.0.0/filter.xsd",

    /**
     * Constructor: OpenLayers.Format.Filter.v1_0_0
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.Filter> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.Filter.v1.prototype.initialize.apply(
            this, [options]
        );
    },

    CLASS_NAME: "OpenLayers.Format.Filter.v1_0_0" 

});