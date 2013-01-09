/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control/DragPan.js
 * @requires OpenLayers/Control/PinchZoom.js
 * @requires OpenLayers/Handler/Click.js
 */

/**
 * Class: OpenLayers.Control.TouchNavigation
 * The navigation control handles map browsing with touch events (dragging,
 *     double-tapping, tap with two fingers, and pinch zoom).  Create a new 
 *     control with the <OpenLayers.Control.TouchNavigation> constructor.
 *
 * If you’re only targeting touch enabled devices with your mapping application,
 *     you can create a map with only a TouchNavigation control. The 
 *     <OpenLayers.Control.Navigation> control is mobile ready by default, but 
 *     you can generate a smaller build of the library by only including this
 *     touch navigation control if you aren't concerned about mouse interaction.
 *
 * Inherits:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.TouchNavigation = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: dragPan
     * {<OpenLayers.Control.DragPan>}
     */
    dragPan: null,

    /**
     * APIProperty: dragPanOptions
     * {Object} Options passed to the DragPan control.
     */
    dragPanOptions: null,

    /**
     * Property: pinchZoom
     * {<OpenLayers.Control.PinchZoom>}
     */
    pinchZoom: null,

    /**
     * APIProperty: pinchZoomOptions
     * {Object} Options passed to the PinchZoom control.
     */
    pinchZoomOptions: null,

    /**
     * APIProperty: clickHandlerOptions
     * {Object} Options passed to the Click handler.
     */
    clickHandlerOptions: null,

    /**
     * APIProperty: documentDrag
     * {Boolean} Allow panning of the map by dragging outside map viewport.
     *     Default is false.
     */
    documentDrag: false,

    /**
     * APIProperty: autoActivate
     * {Boolean} Activate the control when it is added to a map.  Default is
     *     true.
     */
    autoActivate: true,

    /**
     * Constructor: OpenLayers.Control.TouchNavigation
     * Create a new navigation control
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *                    the control
     */
    initialize: function(options) {
        this.handlers = {};
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: destroy
     * The destroy method is used to perform any clean up before the control
     * is dereferenced.  Typically this is where event listeners are removed
     * to prevent memory leaks.
     */
    destroy: function() {
        this.deactivate();
        if(this.dragPan) {
            this.dragPan.destroy();
        }
        this.dragPan = null;
        if (this.pinchZoom) {
            this.pinchZoom.destroy();
            delete this.pinchZoom;
        }
        OpenLayers.Control.prototype.destroy.apply(this,arguments);
    },

    /**
     * Method: activate
     */
    activate: function() {
        if(OpenLayers.Control.prototype.activate.apply(this,arguments)) {
            this.dragPan.activate();
            this.handlers.click.activate();
            this.pinchZoom.activate();
            return true;
        }
        return false;
    },

    /**
     * Method: deactivate
     */
    deactivate: function() {
        if(OpenLayers.Control.prototype.deactivate.apply(this,arguments)) {
            this.dragPan.deactivate();
            this.handlers.click.deactivate();
            this.pinchZoom.deactivate();
            return true;
        }
        return false;
    },
    
    /**
     * Method: draw
     */
    draw: function() {
        var clickCallbacks = {
            click: this.defaultClick,
            dblclick: this.defaultDblClick
        };
        var clickOptions = OpenLayers.Util.extend({
            "double": true,
            stopDouble: true,
            pixelTolerance: 2
        }, this.clickHandlerOptions);
        this.handlers.click = new OpenLayers.Handler.Click(
            this, clickCallbacks, clickOptions
        );
        this.dragPan = new OpenLayers.Control.DragPan(
            OpenLayers.Util.extend({
                map: this.map,
                documentDrag: this.documentDrag
            }, this.dragPanOptions)
        );
        this.dragPan.draw();
        this.pinchZoom = new OpenLayers.Control.PinchZoom(
            OpenLayers.Util.extend({map: this.map}, this.pinchZoomOptions)
        );
    },

    /**
     * Method: defaultClick
     *
     * Parameters:
     * evt - {Event}
     */
    defaultClick: function (evt) {
        if(evt.lastTouches && evt.lastTouches.length == 2) {
            this.map.zoomOut();
        }
    },

    /**
     * Method: defaultDblClick
     *
     * Parameters:
     * evt - {Event}
     */
    defaultDblClick: function (evt) {
        this.map.zoomTo(this.map.zoom + 1, evt.xy);
    },

    CLASS_NAME: "OpenLayers.Control.TouchNavigation"
});
