/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Handler to draw a path on the map.  Polygon is displayed on mouse down,
 * moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Geometry/Polygon.js
 */
OpenLayers.Handler.Polygon = OpenLayers.Class.create();
OpenLayers.Handler.Polygon.prototype = 
  OpenLayers.Class.inherit(OpenLayers.Handler.Path, {
    
    /**
     * @type OpenLayers.Geometry.Polygon
     * @private
     */
    polygon: null,

    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Array} callbacks An object with a 'done' property whos value is
     *                          a function to be called when the path drawing is
     *                          finished. The callback should expect to recieve a
     *                          single argument, the polygon geometry.
     *                          If the callbacks object contains a 'point'
     *                          property, this function will be sent each point
     *                          as they are added.  If the callbacks object contains
     *                          a 'cancel' property, this function will be called when
     *                          the handler is deactivated while drawing.  The cancel
     *                          should expect to receive a geometry.
     * @param {Object} options
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Path.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * Add temporary geometries
     */
    createGeometry: function() {
        this.polygon = new OpenLayers.Geometry.Polygon();
        this.line = new OpenLayers.Geometry.LinearRing();
        this.polygon.addComponent(this.line);
        this.point = new OpenLayers.Geometry.Point();
    },

    /**
     * Destroy temporary geometries
     */
    destroyGeometry: function() {
        this.polygon.destroy();
        this.point.destroy();
    },

    /**
     * Modify the existing geometry given the new point
     * 
     */
    modifyGeometry: function() {
        var index = this.line.components.length - 2;
        this.line.components[index].setX(this.point.x);
        this.line.components[index].setY(this.point.y);
    },

    /**
     * Render geometries on the temporary layer.
     */
    drawGeometry: function() {
        this.layer.renderer.drawGeometry(this.polygon, this.style);
        this.layer.renderer.drawGeometry(this.point, this.style);
    },

    /**
     * Return a clone of the relevant geometry.
     *
     * @type OpenLayers.Geometry.Polygon
     */
    geometryClone: function() {
        return this.polygon.clone();
    },

    /**
     * Handle double-clicks.  Finish the geometry and send it back
     * to the control.
     * 
     * @param {Event} evt
     */
    dblclick: function(evt) {
        if(!this.freehandMode(evt)) {
            // remove the penultimate point
            var index = this.line.components.length - 2;
            this.line.removeComponent(this.line.components[index]);
            this.finalize(this.line);
        }
        return false;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Polygon"
});
