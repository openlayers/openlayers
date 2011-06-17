/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     * APIProperty: multi
     * {Boolean} Cast features to multi-part geometries before passing to the
     *     layer.  Default is false.
     */
    multi: false,

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
        this.handlerOptions = this.handlerOptions || {};
        if (!("multi" in this.handlerOptions)) {
            this.handlerOptions.multi = this.multi;
        }
        var sketchStyle = this.layer.styleMap && this.layer.styleMap.styles.temporary;
        if(sketchStyle) {
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
    
    /**
     * APIMethod: insertXY
     * Insert a point in the current sketch given x & y coordinates.
     *
     * Parameters:
     * x - {Number} The x-coordinate of the point.
     * y - {Number} The y-coordinate of the point.
     */
    insertXY: function(x, y) {
        if (this.handler && this.handler.line) {
            this.handler.insertXY(x, y);
        }
    },

    /**
     * APIMethod: insertDeltaXY
     * Insert a point given offsets from the previously inserted point.
     *
     * Parameters:
     * dx - {Number} The x-coordinate offset of the point.
     * dy - {Number} The y-coordinate offset of the point.
     */
    insertDeltaXY: function(dx, dy) {
        if (this.handler && this.handler.line) {
            this.handler.insertDeltaXY(dx, dy);
        }
    },

    /**
     * APIMethod: insertDirectionLength
     * Insert a point in the current sketch given a direction and a length.
     *
     * Parameters:
     * direction - {Number} Degrees clockwise from the positive x-axis.
     * length - {Number} Distance from the previously drawn point.
     */
    insertDirectionLength: function(direction, length) {
        if (this.handler && this.handler.line) {
            this.handler.insertDirectionLength(direction, length);
        }
    },

    /**
     * APIMethod: insertDeflectionLength
     * Insert a point in the current sketch given a deflection and a length.
     *     The deflection should be degrees clockwise from the previously 
     *     digitized segment.
     *
     * Parameters:
     * deflection - {Number} Degrees clockwise from the previous segment.
     * length - {Number} Distance from the previously drawn point.
     */
    insertDeflectionLength: function(deflection, length) {
        if (this.handler && this.handler.line) {
            this.handler.insertDeflectionLength(deflection, length);
        }
    },
    
    /**
     * APIMethod: undo
     * Remove the most recently added point in the current sketch geometry.
     *
     * Returns: 
     * {Boolean} An edit was undone.
     */
    undo: function() {
        return this.handler.undo && this.handler.undo();
    },
    
    /**
     * APIMethod: redo
     * Reinsert the most recently removed point resulting from an <undo> call.
     *     The undo stack is deleted whenever a point is added by other means.
     *
     * Returns: 
     * {Boolean} An edit was redone.
     */
    redo: function() {
        return this.handler.redo && this.handler.redo();
    },
    
    /**
     * APIMethod: finishSketch
     * Finishes the sketch without including the currently drawn point.
     *     This method can be called to terminate drawing programmatically
     *     instead of waiting for the user to end the sketch.
     */
    finishSketch: function() {
        this.handler.finishGeometry();
    },

    /**
     * APIMethod: cancel
     * Cancel the current sketch.  This removes the current sketch and keeps
     *     the drawing control active.
     */
    cancel: function() {
        this.handler.cancel();
    },

    CLASS_NAME: "OpenLayers.Control.DrawFeature"
});
