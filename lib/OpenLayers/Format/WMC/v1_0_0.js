/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMC/v1.js
 */

/**
 * Class: OpenLayers.Format.WMC.v1_0_0
 * Read and write WMC version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMC.v1>
 */
OpenLayers.Format.WMC.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.WMC.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.0.0
     */
    VERSION: "1.0.0",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/context
     *     http://schemas.opengis.net/context/1.0.0/context.xsd
     */
    schemaLocation: "http://www.opengis.net/context http://schemas.opengis.net/context/1.0.0/context.xsd",

    /**
     * Constructor: OpenLayers.Format.WMC.v1_0_0
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.WMC> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.WMC.v1.prototype.initialize.apply(
            this, [options]
        );
    },

    CLASS_NAME: "OpenLayers.Format.WMC.v1_0_0" 

});