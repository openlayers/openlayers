/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Symbolizer.js
 */

/**
 * Class: OpenLayers.Symbolizer.Raster
 * A symbolizer used to render raster images.
 */
OpenLayers.Symbolizer.Raster = OpenLayers.Class(OpenLayers.Symbolizer, {
    
    /**
     * Constructor: OpenLayers.Symbolizer.Raster
     * Create a symbolizer for rendering rasters.
     *
     * Parameters:
     * config - {Object} An object containing properties to be set on the 
     *     symbolizer.  Any documented symbolizer property can be set at 
     *     construction.
     *
     * Returns:
     * A new raster symbolizer.
     */
    initialize: function(config) {
        OpenLayers.Symbolizer.prototype.initialize.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Symbolizer.Raster"
    
});
