/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the Clear BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control/DragPan.js
 * @requires OpenLayers/Handler/Click.js
 */

/**
 * Class: OpenLayers.Control.TouchNavigation
 * The navigation control handles map browsing with touch events (dragging,
 *     double-tapping, and tap with two fingers).  Create a new navigation
 *     control with the <OpenLayers.Control.TouchNavigation> control.
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
     * APIProprety: dragPanOptions
     * {Object} Options passed to the DragPan control.
     */
    dragPanOptions: null,

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
        OpenLayers.Control.prototype.destroy.apply(this,arguments);
    },

    /**
     * Method: activate
     */
    activate: function() {
        if(OpenLayers.Control.prototype.activate.apply(this,arguments)) {
            this.dragPan.activate();
            this.handlers.click.activate();
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
            return true;
        }
        return false;
    },

    /**
     * Method: draw
     */
    draw: function() {
        var clickCallbacks = {
            'click': this.defaultClick,
            'dblclick': this.defaultDblClick
        };
        var clickOptions = {
            'double': true,
            'stopDouble': true
        };
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
        var newCenter = this.map.getLonLatFromViewPortPx(evt.xy);
        this.map.setCenter(newCenter, this.map.zoom + 1);
    },

    CLASS_NAME: "OpenLayers.Control.TouchNavigation"
});
