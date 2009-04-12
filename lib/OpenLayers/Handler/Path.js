/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Handler/Point.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 */

/**
 * Class: OpenLayers.Handler.Path
 * Handler to draw a path on the map.  Path is displayed on mouse down,
 * moves on mouse move, and is finished on mouse up.
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Point>
 */
OpenLayers.Handler.Path = OpenLayers.Class(OpenLayers.Handler.Point, {
    
    /**
     * Property: line
     * {<OpenLayers.Feature.Vector>}
     */
    line: null,
    
    /**
     * Property: freehand
     * {Boolean} In freehand mode, the handler starts the path on mouse down,
     * adds a point for every mouse move, and finishes the path on mouse up.
     * Outside of freehand mode, a point is added to the path on every mouse
     * click and double-click finishes the path.
     */
    freehand: false,
    
    /**
     * Property: freehandToggle
     * {String} If set, freehandToggle is checked on mouse events and will set
     * the freehand mode to the opposite of this.freehand.  To disallow
     * toggling between freehand and non-freehand mode, set freehandToggle to
     * null.  Acceptable toggle values are 'shiftKey', 'ctrlKey', and 'altKey'.
     */
    freehandToggle: 'shiftKey',

    /**
     * Constructor: OpenLayers.Handler.Path
     * Create a new path hander
     *
     * Parameters:
     * control - {<OpenLayers.Control>} The control that owns this handler
     * callbacks - {Object} An object with a properties whose values are
     *     functions.  Various callbacks described below.
     * options - {Object} An optional object with properties to be set on the
     *           handler
     *
     * Named callbacks:
     * create - Called when a sketch is first created.  Callback called with
     *     the creation point geometry and sketch feature.
     * modify - Called with each move of a vertex with the vertex (point)
     *     geometry and the sketch feature.
     * point - Called as each point is added.  Receives the new point geometry.
     * done - Called when the point drawing is finished.  The callback will
     *     recieve a single argument, the linestring geometry.
     * cancel - Called when the handler is deactivated while drawing.  The
     *     cancel callback will receive a geometry.
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Point.prototype.initialize.apply(this, arguments);
    },
        
    /**
     * Method: createFeature
     * Add temporary geometries
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} The initial pixel location for the new
     *     feature.
     */
    createFeature: function(pixel) {
        var lonlat = this.control.map.getLonLatFromPixel(pixel);
        this.point = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
        );
        this.line = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.LineString([this.point.geometry])
        );
        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
        this.layer.addFeatures([this.line, this.point], {silent: true});
    },
        
    /**
     * Method: destroyFeature
     * Destroy temporary geometries
     */
    destroyFeature: function() {
        OpenLayers.Handler.Point.prototype.destroyFeature.apply(this);
        this.line = null;
    },

    /**
     * Method: removePoint
     * Destroy the temporary point.
     */
    removePoint: function() {
        if(this.point) {
            this.layer.removeFeatures([this.point]);
        }
    },
    
    /**
     * Method: addPoint
     * Add point to geometry.  Send the point index to override
     * the behavior of LinearRing that disregards adding duplicate points.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} The pixel location for the new point.
     */
    addPoint: function(pixel) {
        this.layer.removeFeatures([this.point]);
        var lonlat = this.control.map.getLonLatFromPixel(pixel);
        this.point = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
        );
        this.line.geometry.addComponent(
            this.point.geometry, this.line.geometry.components.length
        );
        this.callback("point", [this.point.geometry, this.getGeometry()]);
        this.callback("modify", [this.point.geometry, this.getSketch()]);
        this.drawFeature();
    },
    
    /**
     * Method: freehandMode
     * Determine whether to behave in freehand mode or not.
     *
     * Returns:
     * {Boolean}
     */
    freehandMode: function(evt) {
        return (this.freehandToggle && evt[this.freehandToggle]) ?
                    !this.freehand : this.freehand;
    },

    /**
     * Method: modifyFeature
     * Modify the existing geometry given the new point
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} The updated pixel location for the latest
     *     point.
     */
    modifyFeature: function(pixel) {
        var lonlat = this.control.map.getLonLatFromPixel(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;
        this.callback("modify", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },

    /**
     * Method: drawFeature
     * Render geometries on the temporary layer.
     */
    drawFeature: function() {
        this.layer.drawFeature(this.line, this.style);
        this.layer.drawFeature(this.point, this.style);
    },

    /**
     * Method: getSketch
     * Return the sketch feature.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>}
     */
    getSketch: function() {
        return this.line;
    },

    /**
     * Method: getGeometry
     * Return the sketch geometry.  If <multi> is true, this will return
     *     a multi-part geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry.LineString>}
     */
    getGeometry: function() {
        var geometry = this.line && this.line.geometry;
        if(geometry && this.multi) {
            geometry = new OpenLayers.Geometry.MultiLineString([geometry]);
        }
        return geometry;
    },

    /**
     * Method: mousedown
     * Handle mouse down.  Add a new point to the geometry and
     * render it. Return determines whether to propagate the event on the map.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    mousedown: function(evt) {
        // ignore double-clicks
        if (this.lastDown && this.lastDown.equals(evt.xy)) {
            return false;
        }
        if(this.lastDown == null) {
            if(this.persist) {
                this.destroyFeature();
            }
            this.createFeature(evt.xy);
        } else if((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
            this.addPoint(evt.xy);
        }
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.drawing = true;
        return false;
    },

    /**
     * Method: mousemove
     * Handle mouse move.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    mousemove: function (evt) {
        if(this.drawing) { 
            if(this.mouseDown && this.freehandMode(evt)) {
                this.addPoint(evt.xy);
            } else {
                this.modifyFeature(evt.xy);
            }
        }
        return true;
    },
    
    /**
     * Method: mouseup
     * Handle mouse up.  Send the latest point in the geometry to
     * the control. Return determines whether to propagate the event on the map.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    mouseup: function (evt) {
        this.mouseDown = false;
        if(this.drawing) {
            if(this.freehandMode(evt)) {
                this.removePoint();
                this.finalize();
            } else {
                if(this.lastUp == null) {
                   this.addPoint(evt.xy);
                }
                this.lastUp = evt.xy;
            }
            return false;
        }
        return true;
    },
  
    /**
     * Method: dblclick 
     * Handle double-clicks.  Finish the geometry and send it back
     * to the control.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        if(!this.freehandMode(evt)) {
            var index = this.line.geometry.components.length - 1;
            this.line.geometry.removeComponent(this.line.geometry.components[index]);
            this.removePoint();
            this.finalize();
        }
        return false;
    },

    CLASS_NAME: "OpenLayers.Handler.Path"
});
