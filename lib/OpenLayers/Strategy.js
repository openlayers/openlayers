/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * Class: OpenLayers.Strategy
 * Abstract vector layer strategy class.  Not to be instantiated directly.  Use
 *     one of the strategy subclasses instead.
 */
OpenLayers.Strategy = OpenLayers.Class({
    
    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,
    
    /**
     * Property: options
     * {Object} Any options sent to the constructor.
     */
    options: null,

    /**
     * Constructor: OpenLayers.Strategy
     * Abstract class for vector strategies.  Create instances of a subclass.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
    },
    
    /**
     * APIMethod: destroy
     * Clean up the strategy.
     */
    destroy: function() {
        this.deactivate();
        this.layer = null;
    },

    /**
     * Method: setLayer.
     *
     * Parameters:
     * {<OpenLayers.Layer.Vector>}
     */
    setLayer: function(layer) {
        this.layer = layer;
    },
    
    /**
     * Method: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     */
    activate: function() {
    },
    
    /**
     * Method: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     */
    deactivate: function() {
    },
   
    CLASS_NAME: "OpenLayers.Strategy" 
});
