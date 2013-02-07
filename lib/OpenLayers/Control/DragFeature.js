/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/Feature.js
 */

/**
 * Class: OpenLayers.Control.DragFeature
 * The DragFeature control moves a feature with a drag of the mouse. Create a
 * new control with the <OpenLayers.Control.DragFeature> constructor.
 *
 * Inherits From:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.DragFeature = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict dragging to a limited set of geometry types,
     *     send a list of strings corresponding to the geometry class names.
     */
    geometryTypes: null,
    
    /**
     * APIProperty: onStart
     * {Function} Define this function if you want to know when a drag starts.
     *     The function should expect to receive two arguments: the feature
     *     that is about to be dragged and the pixel location of the mouse.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that is about to be
     *     dragged.
     * pixel - {<OpenLayers.Pixel>} The pixel location of the mouse.
     */
    onStart: function(feature, pixel) {},

    /**
     * APIProperty: onDrag
     * {Function} Define this function if you want to know about each move of a
     *     feature. The function should expect to receive two arguments: the
     *     feature that is being dragged and the pixel location of the mouse.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that was dragged.
     * pixel - {<OpenLayers.Pixel>} The pixel location of the mouse.
     */
    onDrag: function(feature, pixel) {},

    /**
     * APIProperty: onComplete
     * {Function} Define this function if you want to know when a feature is
     *     done dragging. The function should expect to receive two arguments:
     *     the feature that is being dragged and the pixel location of the
     *     mouse.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that was dragged.
     * pixel - {<OpenLayers.Pixel>} The pixel location of the mouse.
     */
    onComplete: function(feature, pixel) {},

    /**
     * APIProperty: onEnter
     * {Function} Define this function if you want to know when the mouse
     *     goes over a feature and thereby makes this feature a candidate
     *     for dragging.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that is ready
     *     to be dragged.
     */
    onEnter: function(feature) {},

    /**
     * APIProperty: onLeave
     * {Function} Define this function if you want to know when the mouse
     *     goes out of the feature that was dragged.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that was dragged.
     */
    onLeave: function(feature) {},

    /**
     * APIProperty: documentDrag
     * {Boolean} If set to true, mouse dragging will continue even if the
     *     mouse cursor leaves the map viewport. Default is false.
     */
    documentDrag: false,
    
    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,
    
    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>}
     */
    feature: null,

    /**
     * Property: dragCallbacks
     * {Object} The functions that are sent to the drag handler for callback.
     */
    dragCallbacks: {},

    /**
     * Property: featureCallbacks
     * {Object} The functions that are sent to the feature handler for callback.
     */
    featureCallbacks: {},
    
    /**
     * Property: lastPixel
     * {<OpenLayers.Pixel>}
     */
    lastPixel: null,

    /**
     * Constructor: OpenLayers.Control.DragFeature
     * Create a new control to drag features.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} The layer containing features to be
     *     dragged.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handlers = {
            drag: new OpenLayers.Handler.Drag(
                this, OpenLayers.Util.extend({
                    down: this.downFeature,
                    move: this.moveFeature,
                    up: this.upFeature,
                    out: this.cancel,
                    done: this.doneDragging
                }, this.dragCallbacks), {
                    documentDrag: this.documentDrag
                }
            ),
            feature: new OpenLayers.Handler.Feature(
                this, this.layer, OpenLayers.Util.extend({
                    // 'click' and 'clickout' callback are for the mobile
                    // support: no 'over' or 'out' in touch based browsers.
                    click: this.clickFeature,
                    clickout: this.clickoutFeature,
                    over: this.overFeature,
                    out: this.outFeature
                }, this.featureCallbacks),
                {geometryTypes: this.geometryTypes}
            )
        };
    },

    /**
     * Method: clickFeature
     * Called when the feature handler detects a click-in on a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    clickFeature: function(feature) {
        if (this.handlers.feature.touch && !this.over && this.overFeature(feature)) {
            this.handlers.drag.dragstart(this.handlers.feature.evt);
            // to let the events propagate to the feature handler (click callback)
            this.handlers.drag.stopDown = false;
        }
    },

    /**
     * Method: clickoutFeature
     * Called when the feature handler detects a click-out on a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    clickoutFeature: function(feature) {
        if (this.handlers.feature.touch && this.over) {
            this.outFeature(feature);
            this.handlers.drag.stopDown = true;
        }
    },

    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass
     */
    destroy: function() {
        this.layer = null;
        OpenLayers.Control.prototype.destroy.apply(this, []);
    },

    /**
     * APIMethod: activate
     * Activate the control and the feature handler.
     * 
     * Returns:
     * {Boolean} Successfully activated the control and feature handler.
     */
    activate: function() {
        return (this.handlers.feature.activate() &&
                OpenLayers.Control.prototype.activate.apply(this, arguments));
    },

    /**
     * APIMethod: deactivate
     * Deactivate the control and all handlers.
     * 
     * Returns:
     * {Boolean} Successfully deactivated the control.
     */
    deactivate: function() {
        // the return from the handlers is unimportant in this case
        this.handlers.drag.deactivate();
        this.handlers.feature.deactivate();
        this.feature = null;
        this.dragging = false;
        this.lastPixel = null;
        OpenLayers.Element.removeClass(
            this.map.viewPortDiv, this.displayClass + "Over"
        );
        return OpenLayers.Control.prototype.deactivate.apply(this, arguments);
    },

    /**
     * Method: overFeature
     * Called when the feature handler detects a mouse-over on a feature.
     *     This activates the drag handler.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The selected feature.
     *
     * Returns:
     * {Boolean} Successfully activated the drag handler.
     */
    overFeature: function(feature) {
        var activated = false;
        if(!this.handlers.drag.dragging) {
            this.feature = feature;
            this.handlers.drag.activate();
            activated = true;
            this.over = true;
            OpenLayers.Element.addClass(this.map.viewPortDiv, this.displayClass + "Over");
            this.onEnter(feature);
        } else {
            if(this.feature.id == feature.id) {
                this.over = true;
            } else {
                this.over = false;
            }
        }
        return activated;
    },

    /**
     * Method: downFeature
     * Called when the drag handler detects a mouse-down.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} Location of the mouse event.
     */
    downFeature: function(pixel) {
        this.lastPixel = pixel;
        this.onStart(this.feature, pixel);
    },

    /**
     * Method: moveFeature
     * Called when the drag handler detects a mouse-move.  Also calls the
     *     optional onDrag method.
     * 
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} Location of the mouse event.
     */
    moveFeature: function(pixel) {
        var res = this.map.getResolution();
        this.feature.geometry.move(res * (pixel.x - this.lastPixel.x),
                                   res * (this.lastPixel.y - pixel.y));
        this.layer.drawFeature(this.feature);
        this.lastPixel = pixel;
        this.onDrag(this.feature, pixel);
    },

    /**
     * Method: upFeature
     * Called when the drag handler detects a mouse-up.
     * 
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} Location of the mouse event.
     */
    upFeature: function(pixel) {
        if(!this.over) {
            this.handlers.drag.deactivate();
        }
    },

    /**
     * Method: doneDragging
     * Called when the drag handler is done dragging.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} The last event pixel location.  If this event
     *     came from a mouseout, this may not be in the map viewport.
     */
    doneDragging: function(pixel) {
        this.onComplete(this.feature, pixel);
    },

    /**
     * Method: outFeature
     * Called when the feature handler detects a mouse-out on a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature that the mouse left.
     */
    outFeature: function(feature) {
        if(!this.handlers.drag.dragging) {
            this.over = false;
            this.handlers.drag.deactivate();
            OpenLayers.Element.removeClass(
                this.map.viewPortDiv, this.displayClass + "Over"
            );
            this.onLeave(feature);
            this.feature = null;
        } else {
            if(this.feature.id == feature.id) {
                this.over = false;
            }
        }
    },
        
    /**
     * Method: cancel
     * Called when the drag handler detects a mouse-out (from the map viewport).
     */
    cancel: function() {
        this.handlers.drag.deactivate();
        this.over = false;
    },

    /**
     * Method: setMap
     * Set the map property for the control and all handlers.
     *
     * Parameters: 
     * map - {<OpenLayers.Map>} The control's map.
     */
    setMap: function(map) {
        this.handlers.drag.setMap(map);
        this.handlers.feature.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Control.DragFeature"
});
