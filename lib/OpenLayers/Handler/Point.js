/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Handler to draw a point on the map.  Point is displayed on mouse down,
 * moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/Point.js
 */
OpenLayers.Handler.Point = OpenLayers.Class.create();
OpenLayers.Handler.Point.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Handler, {
    
    /**
     * @type OpenLayers.Geometry.Point
     * @private
     */
    point: null,

    /**
     * @type OpenLayers.Layer.Vector
     * @private
     */
    layer: null,
    
    /**
     * @type Boolean
     * @private
     */
    drawing: false,
    
    /**
     * @type Boolean
     * @private
     */
    mouseDown: false,

    /**
     * @type OpenLayers.Pixel
     * @private
     */
    lastDown: null,

    /**
     * @type OpenLayers.Pixel
     * @private
     */
    lastUp: null,

    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Array} callbacks An object with a 'done' property whos value is
     *                          a function to be called when the point drawing
     *                          is finished.  The callback should expect to
     *                          recieve a single argument, the point geometry.
     *                          If the callbacks object contains a 'cancel' property,
     *                          this function will be called when the handler is deactivated
     *                          while drawing.  The cancel should expect to receive a geometry.
     * @param {Object} options
     */
    initialize: function(control, callbacks, options) {
        // TBD: deal with style
        this.style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['default'], {});

        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * turn on the handler
     */
    activate: function() {
        if(!OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            return false;
        }
        // create temporary vector layer for rendering geometry sketch
        // TBD: this could be moved to initialize/destroy - setting visibility here
        var options = {displayInLayerSwitcher: false};
        this.layer = new OpenLayers.Layer.Vector(this.CLASS_NAME, options);
        this.map.addLayer(this.layer);
        return true;
    },
    
    /**
     * Add temporary geometries
     */
    createGeometry: function() {
        this.point = new OpenLayers.Geometry.Point();
    },

    /**
     * turn off the handler
     */
    deactivate: function() {
        if(!OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            return false;
        }
        // call the cancel callback if mid-drawing
        if(this.drawing) {
            this.cancel();
        }
        this.map.removeLayer(this.layer, false);
        this.layer.destroy();
        return true;
    },
    
    /**
     * Destroy the temporary geometries
     */
    destroyGeometry: function() {
        this.point.destroy();
    },

    /**
     * Finish the geometry and call the "done" callback.
     */
    finalize: function() {
        this.layer.renderer.clear();
        this.callback("done", [this.geometryClone()]);
        this.destroyGeometry();
        this.drawing = false;
        this.mouseDown = false;
        this.lastDown = null;
        this.lastUp = null;
    },

    /**
     * Finish the geometry and call the "cancel" callback.
     */
    cancel: function() {
        this.layer.renderer.clear();
        this.callback("cancel", [this.geometryClone()]);
        this.destroyGeometry();
        this.drawing = false;
        this.mouseDown = false;
        this.lastDown = null;
        this.lastUp = null;
    },

    /**
     * Handle double clicks.
     */
    dblclick: function(evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },
    
    /**
     * Render geometries on the temporary layer.
     */
    drawGeometry: function() {
        this.layer.renderer.drawGeometry(this.point, this.style);
    },
    
    /**
     * Return a clone of the relevant geometry.
     *
     * @type OpenLayers.Geometry.Point
     */
    geometryClone: function() {
        return this.point.clone();
    },
  
    /**
     * Handle mouse down.  Add a new point to the geometry and render it.
     * Return determines whether to propagate the event on the map.
     * 
     * @param {Event} evt
     * @type Boolean
     */
    mousedown: function(evt) {
        // check keyboard modifiers
        if(!this.checkModifiers(evt)) {
            return true;
        }
        // ignore double-clicks
        if(this.lastDown && this.lastDown.equals(evt.xy)) {
            return true;
        }
        if(this.lastDown == null) {
            this.createGeometry();
        }
        this.lastDown = evt.xy;
        this.drawing = true;
        var lonlat = this.map.getLonLatFromPixel(evt.xy);
        this.point.setX(lonlat.lon);
        this.point.setY(lonlat.lat);
        this.drawGeometry();
        return false;
    },

    /**
     * Handle mouse move.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     * 
     * @param {Event} evt
     * @type Boolean
     */
    mousemove: function (evt) {
        if(this.drawing) {
            var lonlat = this.map.getLonLatFromPixel(evt.xy);
            this.point.setX(lonlat.lon);
            this.point.setY(lonlat.lat);
            this.drawGeometry();
        }
        return true;
    },

    /**
     * Handle mouse up.  Send the latest point in the geometry to the control.
     * Return determines whether to propagate the event on the map.
     * 
     * @param {Event} evt
     * @type Boolean
     */
    mouseup: function (evt) {
        if(this.drawing) {
            this.finalize(this.point);
            return false;
        } else {
            return true;
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Point"
});
