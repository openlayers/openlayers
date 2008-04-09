/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

 
/**
 * @requires OpenLayers/Layer/WMS.js
 */

/**
 * Class: OpenLayers.Layer.WMS.Untiled
 * *Deprecated*.  To be removed in 3.0.  Instead use OpenLayers.Layer.WMS and 
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

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.WMS.Untiled>} An exact clone of this layer
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.WMS.Untiled(this.name,
                                                   this.url,
                                                   this.params,
                                                   this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.WMS.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    }, 

    CLASS_NAME: "OpenLayers.Layer.WMS.Untiled"
});
