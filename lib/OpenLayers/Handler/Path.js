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
     * control - {<OpenLayers.Control>} 
     * callbacks - {Object} An object with a 'done' property whos value is a
     *     function to be called when the path drawing is finished. The 
     *     callback should expect to recieve a single argument, the line 
     *     string geometry. If the callbacks object contains a 'point' 
     *     property, this function will be sent each point as they are added.  
     *     If the callbacks object contains a 'cancel' property, this function 
     *     will be called when the handler is deactivated while drawing. The 
     *     cancel should expect to receive a geometry.
     * options - {Object} An optional object with properties to be set on the
     *           handler
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Point.prototype.initialize.apply(this, arguments);
    },
        
    /**
     * Method: createFeature
     * Add temporary geometries
     */
    createFeature: function() {
        this.line = new OpenLayers.Feature.Vector(
                                        new OpenLayers.Geometry.LineString());
        this.point = new OpenLayers.Feature.Vector(
                                        new OpenLayers.Geometry.Point());
    },
        
    /**
     * Method: destroyFeature
     * Destroy temporary geometries
     */
    destroyFeature: function() {
        OpenLayers.Handler.Point.prototype.destroyFeature.apply(this);
        if(this.line) {
            this.line.destroy();
        }
        this.line = null;
    },
    
    /**
     * Method: addPoint
     * Add point to geometry.  Send the point index to override
     * the behavior of LinearRing that disregards adding duplicate points.
     */
    addPoint: function() {
        this.line.geometry.addComponent(this.point.geometry.clone(),
                                        this.line.geometry.components.length);
        this.callback("point", [this.point.geometry]);
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
     */
    modifyFeature: function() {
        var index = this.line.geometry.components.length - 1;
        this.line.geometry.components[index].x = this.point.geometry.x;
        this.line.geometry.components[index].y = this.point.geometry.y;
        this.line.geometry.components[index].clearBounds();
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
     * Method: geometryClone
     * Return a clone of the relevant geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry.LineString>}
     */
    geometryClone: function() {
        return this.line.geometry.clone();
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
            this.createFeature();
        }
        this.mouseDown = true;
        this.lastDown = evt.xy;
        var lonlat = this.control.map.getLonLatFromPixel(evt.xy);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;
        if((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
            this.addPoint();
        }
        this.drawFeature();
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
            var lonlat = this.map.getLonLatFromPixel(evt.xy);
            this.point.geometry.x = lonlat.lon;
            this.point.geometry.y = lonlat.lat;
            if(this.mouseDown && this.freehandMode(evt)) {
                this.addPoint();
            } else {
                this.modifyFeature();
            }
            this.drawFeature();
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
                this.finalize();
            } else {
                if(this.lastUp == null) {
                   this.addPoint();
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
            this.finalize();
        }
        return false;
    },

    CLASS_NAME: "OpenLayers.Handler.Path"
});
