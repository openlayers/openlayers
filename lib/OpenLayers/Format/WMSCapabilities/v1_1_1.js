/**
 * @requires OpenLayers/Format/WMSCapabilities/v1_1.js
 */

/**
 * Class: OpenLayers.Format.WMSCapabilities/v1_1_1
 * Read WMS Capabilities version 1.1.1.
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
    initialize: function(options) {
        OpenLayers.Format.WMSCapabilities.v1_1.prototype.initialize.apply(
            this, [options]
        );
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1_1" 

});
