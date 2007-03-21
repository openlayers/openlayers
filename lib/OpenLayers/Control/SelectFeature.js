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
        // Store feature style for restoration later
        if(geometry.feature.originalStyle == null) {
            geometry.feature.originalStyle = geometry.feature.style;
        }
        
        if (this.multiple) {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1) {
                this.layer.renderer.drawGeometry(geometry,
                                                 geometry.feature.originalStyle);
                OpenLayers.Util.removeItem(this.layer.selectedFeatures,
                                           geometry.feature);
            } else {
                this.layer.selectedFeatures.push(geometry.feature);
                this.layer.renderer.drawGeometry(geometry, this.selectStyle);
            }
        } else {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1) {
                this.layer.renderer.drawGeometry(geometry,
                                                 geometry.feature.originalStyle);
                OpenLayers.Util.removeItem(this.layer.selectedFeatures,
                                           geometry.feature);
            } else {
                if (this.layer.selectedFeatures) {
                    for (var i = 0; i < this.layer.selectedFeatures.length; i++) {
                        this.layer.renderer.drawGeometry(
                            this.layer.selectedFeatures[i].geometry,
                            this.layer.selectedFeatures[i].originalStyle);
                    }
                    OpenLayers.Util.clearArray(this.layer.selectedFeatures);
                }    
                this.layer.selectedFeatures.push(geometry.feature);
                this.layer.renderer.drawGeometry(geometry, this.selectStyle);
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
        // Store feature style for restoration later
        if(geometry.feature.originalStyle == null) {
            geometry.feature.originalStyle = geometry.feature.style;
        }
        
        if(!(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1)) {
            this.layer.selectedFeatures.push(geometry.feature);
            this.layer.renderer.drawGeometry(geometry, this.selectStyle);
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
        this.layer.renderer.drawGeometry(geometry, geometry.feature.originalStyle);
        OpenLayers.Util.removeItem(this.layer.selectedFeatures, geometry.feature);
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
