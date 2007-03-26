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
     *                  The function should expect to be called with a geometry.
     */
    onSelect: function() {},

    /**
     * @type {Function} Optional function to be called when a feature is unselected.
     *                  The function should expect to be called with a geometry.
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
     * @param {OpenLayers.Geometry}
     */
    downFeature: function(geometry) {
        if(this.hover) {
            return;
        }
        if(geometry.parent) {
            geometry = geometry.parent;
        }
        if (this.multiple) {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1) {
                this.unselect(geometry);
            } else {
                this.select(geometry);
            }
        } else {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1) {
                this.unselect(geometry);
            } else {
                if (this.layer.selectedFeatures) {
                    for (var i = 0; i < this.layer.selectedFeatures.length; i++) {
                        this.unselect(this.layer.selectedFeatures[i].geometry);
                    }
                }
                this.select(geometry);
            }
        }
    },

    /**
     * Called when the feature handler detects a mouse-over on a feature.
     * Only responds if this.hover is true.
     * @param {OpenLayers.Geometry}
     */
    overFeature: function(geometry) {
        if(!this.hover) {
            return;
        }
        if(geometry.parent) {
            geometry = geometry.parent;
        }
        if(!(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1)) {
            this.select(geometry);
        }
    },

    /**
     * Called when the feature handler detects a mouse-out on a feature.
     * Only responds if this.hover is true.
     * @param {OpenLayers.Geometry}
     */
    outFeature: function(geometry) {
        if(!this.hover) {
            return;
        }
        if(geometry.parent) {
            geometry = geometry.parent;
        }
        this.unselect(geometry);
    },
    
    /**
     * Add feature to the layer's selectedFeature array, render the feature as
     * selected, and call the onSelect function.
     * @param {OpenLayers.Geometry} geometry
     */
    select: function(geometry) {
        // Store feature style for restoration later
        if(geometry.feature.originalStyle == null) {
            geometry.feature.originalStyle = geometry.feature.style;
        }
        this.layer.selectedFeatures.push(geometry.feature);
        this.layer.renderer.drawGeometry(geometry, this.selectStyle);
        this.onSelect(geometry);
    },

    /**
     * Remove feature from the layer's selectedFeature array, render the feature as
     * normal, and call the onUnselect function.
     * @param {OpenLayers.Geometry} geometry
     */
    unselect: function(geometry) {
        // Store feature style for restoration later
        if(geometry.feature.originalStyle == null) {
            geometry.feature.originalStyle = geometry.feature.style;
        }
        this.layer.renderer.drawGeometry(geometry, geometry.feature.originalStyle);
        OpenLayers.Util.removeItem(this.layer.selectedFeatures, geometry.feature);
        this.onUnselect(geometry);
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
