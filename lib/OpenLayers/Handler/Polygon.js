/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Geometry/Polygon.js
 */

/**
 * Class: OpenLayers.Handler.Polygon
 * Handler to draw a polygon on the map.  Polygon is displayed on mouse down,
 * moves on mouse move, and is finished on mouse up.
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Path>
 *  - <OpenLayers.Handler>
 */
OpenLayers.Handler.Polygon = OpenLayers.Class(OpenLayers.Handler.Path, {
    
    /**
     * Parameter: polygon
     * {<OpenLayers.Feature.Vector>}
     */
    polygon: null,

    /**
     * Constructor: OpenLayers.Handler.Polygon
     * Create a Polygon Handler.
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 
     * callbacks - {Object} An object with a 'done' property whos value is
     *                          a function to be called when the path drawing is
     *                          finished. The callback should expect to recieve a
     *                          single argument, the polygon geometry.
     *                          If the callbacks object contains a 'point'
     *                          property, this function will be sent each point
     *                          as they are added.  If the callbacks object contains
     *                          a 'cancel' property, this function will be called when
     *                          the handler is deactivated while drawing.  The cancel
     *                          should expect to receive a geometry.
     * options - {Object} 
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Path.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * Method: createFeature
     * Add temporary geometries
     */
    createFeature: function() {
        this.polygon = new OpenLayers.Feature.Vector(
                                        new OpenLayers.Geometry.Polygon());
        this.line = new OpenLayers.Feature.Vector(
                                        new OpenLayers.Geometry.LinearRing());
        this.polygon.geometry.addComponent(this.line.geometry);
        this.point = new OpenLayers.Feature.Vector(
                                        new OpenLayers.Geometry.Point());
        this.layer.addFeatures([this.polygon, this.point], {silent: true});
    },

    /**
     * Method: destroyFeature
     * Destroy temporary geometries
     */
    destroyFeature: function() {
        OpenLayers.Handler.Path.prototype.destroyFeature.apply(this);
        this.polygon = null;
    },

    /**
     * Method: modifyFeature
     * Modify the existing geometry given the new point
     * 
     */
    modifyFeature: function() {
        var index = this.line.geometry.components.length - 2;
        this.line.geometry.components[index].x = this.point.geometry.x;
        this.line.geometry.components[index].y = this.point.geometry.y;
        this.line.geometry.components[index].clearBounds();
    },

    /**
     * Method: drawFeature
     * Render geometries on the temporary layer.
     */
    drawFeature: function() {
        this.layer.drawFeature(this.polygon, this.style);
        this.layer.drawFeature(this.point, this.style);
    },
    
    /**
     * Method: getGeometry
     * Return the sketch geometry.  If <multi> is true, this will return
     *     a multi-part geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry.Polygon>}
     */
    getGeometry: function() {
        var geometry = this.polygon.geometry;
        if(this.multi) {
            geometry = new OpenLayers.Geometry.MultiPolygon([geometry]);
        }
        return geometry;
    },

    /**
     * Method: dblclick
     * Handle double-clicks.  Finish the geometry and send it back
     * to the control.
     * 
     * Parameters:
     * evt - {Event} 
     */
    dblclick: function(evt) {
        if(!this.freehandMode(evt)) {
            // remove the penultimate point
            var index = this.line.geometry.components.length - 2;
            this.line.geometry.removeComponent(this.line.geometry.components[index]);
            if(this.persist) {
                this.destroyPoint();
            }
            this.finalize();
        }
        return false;
    },

    CLASS_NAME: "OpenLayers.Handler.Polygon"
});
