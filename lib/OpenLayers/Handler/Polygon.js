/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     * APIProperty: holeModifier
     * {String} Key modifier to trigger hole digitizing.  Acceptable values are
     *     "altKey", "shiftKey", or "ctrlKey".  If not set, no hole digitizing
     *     will take place.  Default is null.
     */
    holeModifier: null,
    
    /**
     * Property: drawingHole
     * {Boolean} Currently drawing an interior ring.
     */
    drawingHole: false,
    
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
     *     recieve a single argument, the polygon geometry.
     * cancel - Called when the handler is deactivated while drawing.  The
     *     cancel callback will receive a geometry.
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Path.prototype.initialize.apply(this, arguments);
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
        var lonlat = this.map.getLonLatFromPixel(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);
        this.line = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.LinearRing([this.point.geometry])
        );
        this.polygon = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Polygon([this.line.geometry])
        );
        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
        this.layer.addFeatures([this.polygon, this.point], {silent: true});
    },

    /**
     * Method: addPoint
     * Add point to geometry.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} The pixel location for the new point.
     */
    addPoint: function(pixel) {
        if(!this.drawingHole && this.holeModifier &&
           this.evt && this.evt[this.holeModifier]) {
            var geometry = this.point.geometry;
            var features = this.control.layer.features;
            var candidate, polygon;
            // look for intersections, last drawn gets priority
            for (var i=features.length-1; i>=0; --i) {
                candidate = features[i].geometry;
                if ((candidate instanceof OpenLayers.Geometry.Polygon || 
                    candidate instanceof OpenLayers.Geometry.MultiPolygon) && 
                    candidate.intersects(geometry)) {
                    polygon = features[i];
                    this.control.layer.removeFeatures([polygon], {silent: true});
                    this.control.layer.events.registerPriority(
                        "sketchcomplete", this, this.finalizeInteriorRing
                    );
                    this.control.layer.events.registerPriority(
                        "sketchmodified", this, this.enforceTopology
                    );
                    polygon.geometry.addComponent(this.line.geometry);
                    this.polygon = polygon;
                    this.drawingHole = true;
                    break;
                }
            }
        }
        OpenLayers.Handler.Path.prototype.addPoint.apply(this, arguments);
    },

    /**
     * Method: getCurrentPointIndex
     * 
     * Returns:
     * {Number} The index of the most recently drawn point.
     */
    getCurrentPointIndex: function() {
        return this.line.geometry.components.length - 2;
    },

    /**
     * Method: enforceTopology
     * Simple topology enforcement for drawing interior rings.  Ensures vertices
     *     of interior rings are contained by exterior ring.  Other topology 
     *     rules are enforced in <finalizeInteriorRing> to allow drawing of 
     *     rings that intersect only during the sketch (e.g. a "C" shaped ring
     *     that nearly encloses another ring).
     */
    enforceTopology: function(event) {
        var point = event.vertex;
        var components = this.line.geometry.components;
        // ensure that vertices of interior ring are contained by exterior ring
        if (!this.polygon.geometry.intersects(point)) {
            var last = components[components.length-3];
            point.x = last.x;
            point.y = last.y;
        }
    },

    /**
     * Method: finishGeometry
     * Finish the geometry and send it back to the control.
     */
    finishGeometry: function() {
        var index = this.line.geometry.components.length - 2;
        this.line.geometry.removeComponent(this.line.geometry.components[index]);
        this.removePoint();
        this.finalize();
    },

    /**
     * Method: finalizeInteriorRing
     * Enforces that new ring has some area and doesn't contain vertices of any
     *     other rings.
     */
    finalizeInteriorRing: function() {
        var ring = this.line.geometry;
        // ensure that ring has some area
        var modified = (ring.getArea() !== 0);
        if (modified) {
            // ensure that new ring doesn't intersect any other rings
            var rings = this.polygon.geometry.components;
            for (var i=rings.length-2; i>=0; --i) {
                if (ring.intersects(rings[i])) {
                    modified = false;
                    break;
                }
            }
            if (modified) {
                // ensure that new ring doesn't contain any other rings
                var target;
                outer: for (var i=rings.length-2; i>0; --i) {
                    var points = rings[i].components;
                    for (var j=0, jj=points.length; j<jj; ++j) {
                        if (ring.containsPoint(points[j])) {
                            modified = false;
                            break outer;
                        }
                    }
                }
            }
        }
        if (modified) {
            if (this.polygon.state !== OpenLayers.State.INSERT) {
                this.polygon.state = OpenLayers.State.UPDATE;
            }
        } else {
            this.polygon.geometry.removeComponent(ring);
        }
        this.restoreFeature();
        return false;
    },

    /**
     * APIMethod: cancel
     * Finish the geometry and call the "cancel" callback.
     */
    cancel: function() {
        if (this.drawingHole) {
            this.polygon.geometry.removeComponent(this.line.geometry);
            this.restoreFeature(true);
        }
        return OpenLayers.Handler.Path.prototype.cancel.apply(this, arguments);
    },
    
    /**
     * Method: restoreFeature
     * Move the feature from the sketch layer to the target layer.
     *
     * Properties: 
     * cancel - {Boolean} Cancel drawing.  If falsey, the "sketchcomplete" event
     *     will be fired.
     */
    restoreFeature: function(cancel) {
        this.control.layer.events.unregister(
            "sketchcomplete", this, this.finalizeInteriorRing
        );
        this.control.layer.events.unregister(
            "sketchmodified", this, this.enforceTopology
        );
        this.layer.removeFeatures([this.polygon], {silent: true});
        this.control.layer.addFeatures([this.polygon], {silent: true});
        this.drawingHole = false;
        if (!cancel) {
            // Re-trigger "sketchcomplete" so other listeners can do their
            // business.  While this is somewhat sloppy (if a listener is 
            // registered with registerPriority - not common - between the start
            // and end of a single ring drawing - very uncommon - it will be 
            // called twice).
            // TODO: In 3.0, collapse sketch handlers into geometry specific
            // drawing controls.
            this.control.layer.events.triggerEvent(
                "sketchcomplete", {feature : this.polygon}
            );
        }
    },

    /**
     * Method: destroyFeature
     * Destroy temporary geometries
     *
     * Parameters:
     * force - {Boolean} Destroy even if persist is true.
     */
    destroyFeature: function(force) {
        OpenLayers.Handler.Path.prototype.destroyFeature.call(
            this, force);
        this.polygon = null;
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
     * Method: getSketch
     * Return the sketch feature.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>}
     */
    getSketch: function() {
        return this.polygon;
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
        var geometry = this.polygon && this.polygon.geometry;
        if(geometry && this.multi) {
            geometry = new OpenLayers.Geometry.MultiPolygon([geometry]);
        }
        return geometry;
    },

    CLASS_NAME: "OpenLayers.Handler.Polygon"
});
