/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XLS/v1.js
 */

/**
 * Class: OpenLayers.Format.XLS.v1_1_0
 * Read / write XLS version 1.1.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XLS.v1>
 */
OpenLayers.Format.XLS.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.XLS.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.1
     */
    VERSION: "1.1",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/xls
     *   http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd
     */
    schemaLocation: "http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd",

    /**
     * Constructor: OpenLayers.Format.XLS.v1_1_0
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.XLS> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XLS.v1.prototype.initialize.apply(
            this, [options]
        );
    },

    CLASS_NAME: "OpenLayers.Format.XLS.v1_1_0"

});

// Support non standard implementation
OpenLayers.Format.XLS.v1_1 = OpenLayers.Format.XLS.v1_1_0;
