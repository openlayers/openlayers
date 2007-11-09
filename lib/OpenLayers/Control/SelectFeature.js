/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Feature/Vector.js
 *
 * Class: OpenLayers.Control.SelectFeature
 * Selects vector features from a given layer on click or hover. 
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.SelectFeature = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * APIProperty: multiple
     * {Boolean} Allow selection of multiple geometries
     */
    multiple: false, 

    /**
     * APIProperty: hover
     * {Boolean} Select on mouse over and deselect on mouse out.  If true, this
     * ignores clicks and only listens to mouse moves.
     */
    hover: false,
    
    /**
     * APIProperty: onSelect 
     * {Function} Optional function to be called when a feature is selected.
     * The function should expect to be called with a feature.
     */
    onSelect: function() {},

    /**
     * APIProperty: onUnselect
     * {Function} Optional function to be called when a feature is unselected.
     *                  The function should expect to be called with a feature.
     */
    onUnselect: function() {},

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict selecting to a limited set of geometry types,
     *     send a list of strings corresponding to the geometry class names.
     */
    geometryTypes: null,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,
    
    /**
     * APIProperty: callbacks
     * {Object} The functions that are sent to the handler for callback
     */
    callbacks: null,
    
    /**
     * APIProperty: selectStyle 
     * {Object} Hash of styles
     */
    selectStyle: OpenLayers.Feature.Vector.style['select'],

    /**
     * Property: handler
     * {<OpenLayers.Handler.Feature>}
     */
    handler: null,

    /**
     * Constructor: <OpenLayers.Control.SelectFeature>
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} 
     * options - {Object} 
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.callbacks = OpenLayers.Util.extend({
                                                  click: this.clickFeature,
                                                  over: this.overFeature,
                                                  out: this.outFeature
                                                }, this.callbacks);
        var handlerOptions = {geometryTypes: this.geometryTypes};
        this.handler = new OpenLayers.Handler.Feature(this, layer,
                                                      this.callbacks,
                                                      handlerOptions);
    },

    /**
     * Method: clickFeature
     * Called when the feature handler detects a click on a feature
     *
     * Parameters:
     * feature - {<OpenLayers.Vector.Feature>} 
     */
    clickFeature: function(feature) {
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
     * Method: overFeature
     * Called when the feature handler detects a mouse-over on a feature.
     * Only responds if this.hover is true.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
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
     * Method: outFeature
     * Called when the feature handler detects a mouse-out on a feature.
     * Only responds if this.hover is true.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    outFeature: function(feature) {
        if(!this.hover) {
            return;
        }
        this.unselect(feature);
    },
    
    /**
     * Method: select
     * Add feature to the layer's selectedFeature array, render the feature as
     * selected, and call the onSelect function.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    select: function(feature) {
        // Store feature style for restoration later
        if(feature.originalStyle == null) {
            feature.originalStyle = feature.style;
        }
        this.layer.selectedFeatures.push(feature);
        feature.style = this.selectStyle;
        this.layer.drawFeature(feature);
        this.onSelect(feature);
    },

    /**
     * Method: unselect
     * Remove feature from the layer's selectedFeature array, render the feature as
     * normal, and call the onUnselect function.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    unselect: function(feature) {
        // Store feature style for restoration later
        if(feature.originalStyle != null) {
            feature.style = feature.originalStyle;
        }
        this.layer.drawFeature(feature);
        OpenLayers.Util.removeItem(this.layer.selectedFeatures, feature);
        this.onUnselect(feature);
    },

    /** 
     * Method: setMap
     * Set the map property for the control. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Control.SelectFeature"
});
