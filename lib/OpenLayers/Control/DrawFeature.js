/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Feature/Vector.js
 */

/**
 * Class: OpenLayers.Control.DrawFeature
 * The DrawFeature control draws point, line or polygon features on a vector
 * layer when active.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.DrawFeature = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,

    /**
     * Property: callbacks
     * {Object} The functions that are sent to the handler for callback
     */
    callbacks: null,
    
    /**
     * Constant: EVENT_TYPES
     *
     * Supported event types:
     * featureadded - Triggered when a feature is added
     */
    EVENT_TYPES: ["featureadded"],
    
    /**
     * APIProperty: featureAdded
     * {Function} Called after each feature is added
     */
    featureAdded: function() {},

    /**
     * APIProperty: handlerOptions
     * {Object} Used to set non-default properties on the control's handler
     */
    handlerOptions: null,
    
    /**
     * Constructor: OpenLayers.Control.DrawFeature
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} 
     * handler - {<OpenLayers.Handler>} 
     * options - {Object} 
     */
    initialize: function(layer, handler, options) {
        
        // concatenate events specific to vector with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.DrawFeature.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );
        
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.callbacks = OpenLayers.Util.extend(
            {
                done: this.drawFeature,
                modify: function(vertex, feature) {
                    this.layer.events.triggerEvent(
                        "sketchmodified", {vertex: vertex, feature: feature}
                    );
                },
                create: function(vertex, feature) {
                    this.layer.events.triggerEvent(
                        "sketchstarted", {vertex: vertex, feature: feature}
                    );
                }
            },
            this.callbacks
        );
        this.layer = layer;
        var sketchStyle = this.layer.styleMap && this.layer.styleMap.styles.temporary;
        if(sketchStyle) {
            this.handlerOptions = this.handlerOptions || {};
            this.handlerOptions.layerOptions = OpenLayers.Util.applyDefaults(
                this.handlerOptions.layerOptions,
                {styleMap: new OpenLayers.StyleMap({"default": sketchStyle})}
            );
        }
        this.handler = new handler(this, this.callbacks, this.handlerOptions);
    },

    /**
     * Method: drawFeature
     */
    drawFeature: function(geometry) {
        var feature = new OpenLayers.Feature.Vector(geometry);
        var proceed = this.layer.events.triggerEvent(
            "sketchcomplete", {feature: feature}
        );
        if(proceed !== false) {
            feature.state = OpenLayers.State.INSERT;
            this.layer.addFeatures([feature]);
            this.featureAdded(feature);
            this.events.triggerEvent("featureadded",{feature : feature});
        }
    },

    CLASS_NAME: "OpenLayers.Control.DrawFeature"
});
