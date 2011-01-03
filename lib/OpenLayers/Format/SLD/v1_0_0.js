/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/SLD/v1.js
 * @requires OpenLayers/Format/Filter/v1_0_0.js
 */

/**
 * Class: OpenLayers.Format.SLD.v1_0_0
 * Write SLD version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.SLD.v1>
 */
OpenLayers.Format.SLD.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.SLD.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.0.0
     */
    VERSION: "1.0.0",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/sld
     *   http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd
     */
    schemaLocation: "http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd",

    /**
     * Constructor: OpenLayers.Format.SLD.v1_0_0
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.SLD> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.SLD.v1.prototype.initialize.apply(
            this, [options]
        );
    },

    CLASS_NAME: "OpenLayers.Format.SLD.v1_0_0" 

});
