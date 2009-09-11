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

    /**
     * Method: read_cap_SRS
     */
    read_cap_SRS: function(layer, node) {
        var srs = this.getChildValue(node);
        if (srs.indexOf(" ")) {
            // v1.1.0 style SRS
            var values = srs.split(/ +/);
            for (var i=0, len=values.length; i<len; i++) {
                layer.srs[values[i]] = true;
            }
        } else {
            layer.srs[srs] = true;
        }
    },

    CLASS_NAME: "OpenLayers.Format.WMSCapabilities.v1_1_1" 

});
