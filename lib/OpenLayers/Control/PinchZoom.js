/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the Clear BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Handler/Pinch.js
 */

/**
 * Class: OpenLayers.Control.PinchZoom
 *
 * Inherits:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.PinchZoom = OpenLayers.Class(OpenLayers.Control, {

    /** 
     * Property: type
     * {OpenLayers.Control.TYPES}
     */
    type: OpenLayers.Control.TYPE_TOOL,

    /**
     * Property: containerCenter
     * {Object} Cached object representing the layer container center (in pixels).
     */
    containerCenter: null,

    /**
     * Property: pinchOrigin
     * {Object} Cached object representing the pinch start (in pixels).
     */
    pinchOrigin: null,    
    
    /**
     * Property: currentCenter
     * {Object} Cached object representing the latest pinch center (in pixels).
     */
    currentCenter: null,    

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,
    
    /**
     * Constructor: OpenLayers.Control.PinchZoom
     * Create a control for zooming with pinch gestures.  This works on devices
     *     with multi-touch support.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *                    the control
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.handler = new OpenLayers.Handler.Pinch(this, {
            start: this.pinchStart,
            move: this.pinchMove,
            done: this.pinchDone
        }, this.handlerOptions);
    },
    
    /**
     * APIMethod: activate
     * Activate this control.  Must be called after the control is added to a 
     * map.
     *
     * Returns:
     * {Boolean} The control was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Control.prototype.activate.apply(this,arguments);
        if (activated) {
            this.map.events.on({
                moveend: this.updateContainerCenter,
                scope: this
            });
            this.updateContainerCenter();
        }
        return activated;
    },

    /**
     * APIMethod: deactivate
     * Deactivate this control.
     *
     * Returns:
     * {Boolean} The control was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Control.prototype.deactivate.apply(this,arguments);
        if (this.map && this.map.events) {
            this.map.events.un({
                moveend: this.updateContainerCenter,
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: updateContainerCenter
     * Must be called each time the layer container moves.
     */
    updateContainerCenter: function() {
        var container = this.map.layerContainerDiv;
        // the layer container div is a square of 100px/100px
        this.containerCenter = {
            x: parseInt(container.style.left, 10) + 50,
            y: parseInt(container.style.top, 10) + 50
        };
    },

    /**
     * Method: pinchStart
     *
     * Parameters:
     * evt - {Event}
     * pinchData - {Object} pinch data object related to the current touchmove
     *     of the pinch gesture. This give us the current scale of the pinch.
     */
    pinchStart: function(evt, pinchData) {
        this.pinchOrigin = evt.xy;
        this.currentCenter = evt.xy;
    },
    
    /**
     * Method: pinchMove
     *
     * Parameters:
     * evt - {Event}
     * pinchData - {Object} pinch data object related to the current touchmove
     *     of the pinch gesture. This give us the current scale of the pinch.
     */
    pinchMove: function(evt, pinchData) {
        var scale = pinchData.scale;
        var containerCenter = this.containerCenter;
        var pinchOrigin = this.pinchOrigin;
        var current = evt.xy;

        var dx = Math.round((current.x - pinchOrigin.x) + (scale - 1) * (containerCenter.x - pinchOrigin.x));
        var dy = Math.round((current.y - pinchOrigin.y) + (scale - 1) * (containerCenter.y - pinchOrigin.y));

        this.applyTransform(
            "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")"
        );
        this.currentCenter = current;
    },
    
    /**
     * Method: applyTransform
     * Applies the given transform to layers.
     */
    applyTransform: function(transform) {
        var style = this.map.layerContainerDiv.style;
        style['-webkit-transform'] = transform;
        style['-moz-transform'] = transform;
    },
    
    /**
     * Method: pinchDone
     *
     * Parameters:
     * evt - {Event}
     * start - {Object} pinch data object related to the touchstart event that
     *     started the pinch gesture.
     * last - {Object} pinch data object related to the last touchmove event
     *     of the pinch gesture. This give us the final scale of the pinch.
     */
    pinchDone: function(evt, start, last) {
        this.applyTransform("");
        var zoom = this.map.getZoomForResolution(this.map.getResolution() / last.scale, true);
        if (zoom !== this.map.getZoom() || !this.currentCenter.equals(this.pinchOrigin)) {
            var resolution = this.map.getResolutionForZoom(zoom);

            var location = this.map.getLonLatFromPixel(this.pinchOrigin);
            var zoomPixel = this.currentCenter;        
            var size = this.map.getSize();

            location.lon += resolution * ((size.w / 2) - zoomPixel.x);
            location.lat -= resolution * ((size.h / 2) - zoomPixel.y);

            this.map.setCenter(location, zoom);
        }
    },

    CLASS_NAME: "OpenLayers.Control.PinchZoom"

});
