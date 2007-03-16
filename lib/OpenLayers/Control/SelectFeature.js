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
     * @type {OpenLayers.Layer.Vector}
     */
    layer: null,

    /**
     * @type {OpenLayers.Handler.Select}
     */
    handler: null,
    
    /**
     * @type {Object} The functions that are sent to the handler for callback
     */
    callbacks: {},
    
    /**
     * @type {Object} Hash of styles
     */
    selectStyle: OpenLayers.Feature.Vector.style['select'],

    /**
     * @type {Object} Hash of styles
     * @private
     */
    originalStyle: null,

    /**
     * @type {Boolean} Allow selection of multiple geometries
     */
    multiple: false, 

    /**
     * @param {OpenLayers.Layer.Vector} layer
     * @param {OpenLayers.Handler} handler
     * @param {Object} options
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.callbacks = OpenLayers.Util.extend({down: this.downFeature},
                                                this.callbacks);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Select(this, layer, this.callbacks);
    },

    /**
     *
     */
    downFeature: function(geometry) {
        // Store feature style for restoration later
        if(geometry.feature.originalStyle == null) {
            geometry.feature.originalStyle = geometry.feature.style;
        }
        
        if (this.multiple) {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1) {
                this.layer.renderer.drawGeometry(geometry, geometry.feature.originalStyle);
                OpenLayers.Util.removeItem(this.layer.selectedFeatures, geometry.feature);
            } else {
                this.layer.selectedFeatures.push(geometry.feature);
                this.layer.renderer.drawGeometry(geometry, this.selectStyle);
            }
        } else {
            if(OpenLayers.Util.indexOf(this.layer.selectedFeatures, geometry.feature) > -1) {
                this.layer.renderer.drawGeometry(geometry, geometry.feature.originalStyle);
                OpenLayers.Util.removeItem(this.layer.selectedFeatures, geometry.feature);
            } else {
                if (this.layer.selectedFeatures) {
                    for (var i = 0; i < this.layer.selectedFeatures.length; i++) {
                        this.layer.renderer.drawGeometry(this.layer.selectedFeatures[i].geometry, this.layer.selectedFeatures[i].originalStyle);
                    }
                    OpenLayers.Util.clearArray(this.layer.selectedFeatures);
                }    
                this.layer.selectedFeatures.push(geometry.feature);
                this.layer.renderer.drawGeometry(geometry, this.selectStyle);
            }
        }    
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
