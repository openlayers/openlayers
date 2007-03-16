/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Draws features on a vector layer when active.
 * 
 * @class
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Feature/Vector.js
 */
OpenLayers.Control.DrawFeature = OpenLayers.Class.create();
OpenLayers.Control.DrawFeature.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Control, {
    
    /**
     * @type OpenLayers.Layer.Vector
     */
    layer: null,

    /**
     * @type {Object} The functions that are sent to the handler for callback
     */
    callbacks: {},
    
    /**
     * @type {Function} Called after each feature is added
     */
    featureAdded: function() {},

    /**
     * Used to set non-default properties on the control's handler
     *
     * @type Object
     */
    handlerOptions: null,
    
    /**
     * @param {OpenLayers.Layer.Vector} layer
     * @param {OpenLayers.Handler} handler
     * @param {Object} options
     */
    initialize: function(layer, handler, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.callbacks = OpenLayers.Util.extend({done: this.drawFeature},
                                                this.callbacks);
        this.layer = layer;
        this.handler = new handler(this, this.callbacks, this.handlerOptions);
    },

    /**
     *
     */
    drawFeature: function(geometry) {
        var feature = new OpenLayers.Feature.Vector(geometry);
        this.layer.addFeatures([feature]);
        this.featureAdded(feature);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.DrawFeature"
});
