/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Handler to draw a path on the map.  Path is displayed on mouse down,
 * moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler/Point.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Geometry/LineString.js
 */
OpenLayers.Handler.Path = OpenLayers.Class.create();
OpenLayers.Handler.Path.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Handler.Point, {
    
    /**
     * @type OpenLayers.Geometry.LineString
     * @private
     */
    line: null,
    
    /**
     * In freehand mode, the handler starts the path on mouse down, adds a point
     * for every mouse move, and finishes the path on mouse up.  Outside of
     * freehand mode, a point is added to the path on every mouse click and
     * double-click finishes the path.
     * 
     * @type Boolean
     */
    freehand: false,
    
    /**
     * If set, freehandToggle is checked on mouse events and will set the
     * freehand mode to the opposite of this.freehand.  To disallow toggling
     * between freehand and non-freehand mode, set freehandToggle to null.
     * Acceptable toggle values are 'shiftKey', 'ctrlKey', and 'altKey'.
     *
     * @type String
     */
    freehandToggle: 'shiftKey',

    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Array} callbacks An object with a 'done' property whos value is
     *                          a function to be called when the path drawing is
     *                          finished. The callback should expect to recieve a
     *                          single argument, the line string geometry.
     *                          If the callbacks object contains a 'point'
     *                          property, this function will be sent each point
     *                          as they are added.  If the callbacks object contains
     *                          a 'cancel' property, this function will be called when
     *                          the handler is deactivated while drawing.  The cancel
     *                          should expect to receive a geometry.
     * @param {Object} options
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Point.prototype.initialize.apply(this, arguments);
    },
        
    /**
     * Add temporary geometries
     */
    createGeometry: function() {
        this.line = new OpenLayers.Geometry.LineString();
        this.point = new OpenLayers.Geometry.Point();
    },
        
    /**
     * Destroy temporary geometries
     */
    destroyGeometry: function() {
        this.line.destroy();
        this.point.destroy();
    },
    
    /**
     * Add point to geometry.  Send the point index to override
     * the behavior of LinearRing that disregards adding duplicate points.
     */
    addPoint: function() {
        this.line.addComponent(this.point.clone(), this.line.components.length);
    },
    
    /**
     * Determine whether to behanve in freehand mode or not.
     *
     * @type Boolean
     */
    freehandMode: function(evt) {
        return (this.freehandToggle && evt[this.freehandToggle]) ?
                    !this.freehand : this.freehand;
    },

    /**
     * Modify the existing geometry given the new point
     * 
     */
    modifyGeometry: function() {
        var index = this.line.components.length - 1;
        this.line.components[index].x = this.point.x;
        this.line.components[index].y = this.point.y;
    },
    
    /**
     * Render geometries on the temporary layer.
     */
    drawGeometry: function() {
        this.layer.renderer.drawGeometry(this.line, this.style);
        this.layer.renderer.drawGeometry(this.point, this.style);
    },

    /**
     * Return a clone of the relevant geometry.
     *
     * @type OpenLayers.Geometry.LineString
     */
    geometryClone: function() {
        return this.line.clone();
    },

    /**
     * Handle mouse down.  Add a new point to the geometry and render it.
     * Return determines whether to propagate the event on the map.
     * 
     * @param {Event} evt
     * @type Boolean
     */
    mousedown: function(evt) {
        // ignore double-clicks
        if (this.lastDown && this.lastDown.equals(evt.xy)) {
            return false;
        }
        if(this.lastDown == null) {
            this.createGeometry();
        }
        this.mouseDown = true;
        this.lastDown = evt.xy;
        var lonlat = this.control.map.getLonLatFromPixel(evt.xy);
        this.point.x = lonlat.lon;
        this.point.y = lonlat.lat;
        if((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
            this.addPoint();
        }
        this.drawGeometry();
        this.drawing = true;
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
            this.point.x = lonlat.lon;
            this.point.y = lonlat.lat;
            if(this.mouseDown && this.freehandMode(evt)) {
                this.addPoint();
            } else {
                this.modifyGeometry();
            }
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
        this.mouseDown = false;
        if(this.drawing) {
            if(this.freehandMode(evt)) {
                this.finalize();
            } else {
                if(this.lastUp == null) {
                   this.addPoint();
                }
                this.lastUp = evt.xy;
                this.callback("point", [this.point]);
            }
            return false;
        }
        return true;
    },
  
    /**
     * Handle double-clicks.  Finish the geometry and send it back
     * to the control.
     * 
     * @param {Event} evt
     */
    dblclick: function(evt) {
        if(!this.freehandMode(evt)) {
            var index = this.line.components.length - 1;
            this.line.removeComponent(this.line.components[index]);
            this.finalize(this.line);
        }
        return false;
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Path"
});
