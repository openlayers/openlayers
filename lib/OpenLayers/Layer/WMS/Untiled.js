/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

 
/**
 * @requires OpenLayers/Layer/WMS.js
 *
 * Class: OpenLayers.Layer.WMS
 * Deprecated, to be removed in 3.0 - instead use OpenLayers.Layer.WMS and 
 *     pass the option 'singleTile' as true.
 * 
 * Inherits from: 
 *  - <OpenLayers.Layer.WMS>
 */
OpenLayers.Layer.WMS.Untiled = OpenLayers.Class(OpenLayers.Layer.WMS, {

    /**
     * APIProperty: singleTile
     * {singleTile} Always true for untiled.
     */
    singleTile: true,

    /**
     * Constructor: OpenLayers.Layer.WMS.Untiled
     *
     * Parameters:
     * name - {String} 
     * url - {String} 
     * params - {Object} 
     * options - {Object} 
     */
    initialize: function(name, url, params, options) {
        OpenLayers.Layer.WMS.prototype.initialize.apply(this, arguments);
        
        var msg = "The OpenLayers.Layer.WMS.Untiled class is deprecated and " +
                  "will be removed in 3.0. Instead, you should use the " +
                  "normal OpenLayers.Layer.WMS class, passing it the option " +
                  "'singleTile' as true.";
        OpenLayers.Console.warn(msg);
    },    
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WMS.Untiled"
});
