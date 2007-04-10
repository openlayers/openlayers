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
OpenLayers.Control.SelectFeature = OpenLayers.Class.create();
OpenLayers.Control.SelectFeature.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Control, {
    
    /**
     * @type {Boolean} Allow selection of multiple geometries
     */
    multiple: false, 

    /**
     * @type {Boolean} Select on mouse over and deselect on mouse out.  If
     *                 true, this ignores clicks and only listens to mouse moves.
     */
    hover: false,
    
    /**
     * @type {Function} Optional function to be called when a feature is selected.
     *                  The function should expect to be called with a feature.
     */
    onSelect: function() {},

    /**
     * @type {Function} Optional function to be called when a feature is unselected.
     *                  The function should expect to be called with a feature.
     */
    onUnselect: function() {},

    /**
     * @type {OpenLayers.Layer.Vector}
     */
    layer: null,
    
    /**
     * @type {Object} The functions that are sent to the handler for callback
     */
    callbacks: {},
    
    /**
     * @type {Object} Hash of styles
     */
    selectStyle: OpenLayers.Feature.Vector.style['select'],

    /**
     * @type {OpenLayers.Handler.Feature}
     * @private
     */
    handler: null,

    /**
     * @param {OpenLayers.Layer.Vector} layer
     * @param {OpenLayers.Handler} handler
     * @param {Object} options
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.callbacks = OpenLayers.Util.extend({
                                                  down: this.downFeature,
                                                  over: this.overFeature,
                                                  out: this.outFeature
                                                }, this.callbacks);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Feature(this, layer, this.callbacks);
    },

    /**
     * Called when the feature handler detects a mouse-down on a feature
     * @param {OpenLayers.Vector.Feature}
     */
    downFeature: function(feature) {
        if(this.hover) {
            return;
        }
        if (this.multiple) {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, feature) > -1) {
                this.unselect(feature);
            } else {
                this.select(feature);
            }
        } else {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, feature) > -1) {
                this.unselect(feature);
            } else {
                if (this.layer.selectedFeatures) {
                    for (var i = 0; i < this.layer.selectedFeatures.length; i++) {
                        this.unselect(this.layer.selectedFeatures[i]);
                    }
                }
                this.select(feature);
            }
        }
    },

    /**
     * Called when the feature handler detects a mouse-over on a feature.
     * Only responds if this.hover is true.
     * @param {OpenLayers.Feature.Vector}
     */
    overFeature: function(feature) {
        if(!this.hover) {
            return;
        }
        if(!(OpenLayers.Util.indexOf(this.layer.selectedFeatures, feature) > -1)) {
            this.select(feature);
        }
    },

    /**
     * Called when the feature handler detects a mouse-out on a feature.
     * Only responds if this.hover is true.
     * @param {OpenLayers.Feature.Vector}
     */
    outFeature: function(feature) {
        if(!this.hover) {
            return;
        }
        this.unselect(feature);
    },
    
    /**
     * Add feature to the layer's selectedFeature array, render the feature as
     * selected, and call the onSelect function.
     * @param {OpenLayers.Feature.Vector} feature
     */
    select: function(feature) {
        // Store feature style for restoration later
        if(feature.originalStyle == null) {
            feature.originalStyle = feature.style;
        }
        this.layer.selectedFeatures.push(feature);
        this.layer.drawFeature(feature, this.selectStyle);
        this.onSelect(feature);
    },

    /**
     * Remove feature from the layer's selectedFeature array, render the feature as
     * normal, and call the onUnselect function.
     * @param {OpenLayers.Feature.Vector} feature
     */
    unselect: function(feature) {
        // Store feature style for restoration later
        if(feature.originalStyle == null) {
            feature.originalStyle = feature.style;
        }
        this.layer.drawFeature(feature, feature.originalStyle);
        OpenLayers.Util.removeItem(this.layer.selectedFeatures, feature);
        this.onUnselect(feature);
    },

    /** Set the map property for the control. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.SelectFeature"
});
