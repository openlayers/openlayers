/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/Point.js
 */

/**
 * Class: OpenLayers.Handler.Point
 * Handler to draw a point on the map.  Point is displayed on mouse down,
 *     moves on mouse move, and is finished on mouse up.  The handler triggers
 *     callbacks for 'done', 'cancel', and 'modify'.  The modify callback is
 *     called with each change in the sketch and will receive the latest point
 *     drawn.  Create a new instance with the <OpenLayers.Handler.Point>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Handler>
 */
OpenLayers.Handler.Point = OpenLayers.Class(OpenLayers.Handler, {
    
    /**
     * Property: point
     * {<OpenLayers.Feature.Vector>} The currently drawn point
     */
    point: null,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>} The temporary drawing layer
     */
    layer: null,
    
    /**
     * APIProperty: multi
     * {Boolean} Cast features to multi-part geometries before passing to the
     *     layer.  Default is false.
     */
    multi: false,
    
    /**
     * Property: drawing 
     * {Boolean} A point is being drawn
     */
    drawing: false,
    
    /**
     * Property: mouseDown
     * {Boolean} The mouse is down
     */
    mouseDown: false,

    /**
     * Property: lastDown
     * {<OpenLayers.Pixel>} Location of the last mouse down
     */
    lastDown: null,

    /**
     * Property: lastUp
     * {<OpenLayers.Pixel>}
     */
    lastUp: null,

    /**
     * APIProperty: persist
     * {Boolean} Leave the feature rendered until destroyFeature is called.
     *     Default is false.  If set to true, the feature remains rendered until
     *     destroyFeature is called, typically by deactivating the handler or
     *     starting another drawing.
     */
    persist: false,

    /**
     * Property: layerOptions
     * {Object} Any optional properties to be set on the sketch layer.
     */
    layerOptions: null,

    /**
     * Constructor: OpenLayers.Handler.Point
     * Create a new point handler.
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
     * done - Called when the point drawing is finished.  The callback will
     *     recieve a single argument, the point geometry.
     * cancel - Called when the handler is deactivated while drawing.  The
     *     cancel callback will receive a geometry.
     */
    initialize: function(control, callbacks, options) {
        if(!(options && options.layerOptions && options.layerOptions.styleMap)) {
            this.style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['default'], {});
        }

        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
    },
    
    /**
     * APIMethod: activate
     * turn on the handler
     */
    activate: function() {
        if(!OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            return false;
        }
        // create temporary vector layer for rendering geometry sketch
        // TBD: this could be moved to initialize/destroy - setting visibility here
        var options = OpenLayers.Util.extend({
            displayInLayerSwitcher: false,
            // indicate that the temp vector layer will never be out of range
            // without this, resolution properties must be specified at the
            // map-level for this temporary layer to init its resolutions
            // correctly
            calculateInRange: OpenLayers.Function.True
        }, this.layerOptions);
        this.layer = new OpenLayers.Layer.Vector(this.CLASS_NAME, options);
        this.map.addLayer(this.layer);
        return true;
    },
    
    /**
     * Method: createFeature
     * Add temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.map.getLonLatFromPixel(pixel);
        this.point = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat)
        );
        this.callback("create", [this.point.geometry, this.point]);
        this.point.geometry.clearBounds();
        this.layer.addFeatures([this.point], {silent: true});
    },

    /**
     * APIMethod: deactivate
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
        this.destroyFeature();
        // If a layer's map property is set to null, it means that that layer
        // isn't added to the map. Since we ourself added the layer to the map
        // in activate(), we can assume that if this.layer.map is null it means
        // that the layer has been destroyed (as a result of map.destroy() for
        // example.
        if (this.layer.map != null) {
            this.layer.destroy(false);
        }
        this.layer = null;
        return true;
    },
    
    /**
     * Method: destroyFeature
     * Destroy the temporary geometries
     */
    destroyFeature: function() {
        if(this.layer) {
            this.layer.destroyFeatures();
        }
        this.point = null;
    },

    /**
     * Method: finalize
     * Finish the geometry and call the "done" callback.
     *
     * Parameters:
     * cancel - {Boolean} Call cancel instead of done callback.  Default is
     *     false.
     */
    finalize: function(cancel) {
        var key = cancel ? "cancel" : "done";
        this.drawing = false;
        this.mouseDown = false;
        this.lastDown = null;
        this.lastUp = null;
        this.callback(key, [this.geometryClone()]);
        if(cancel || !this.persist) {
            this.destroyFeature();
        }
    },

    /**
     * APIMethod: cancel
     * Finish the geometry and call the "cancel" callback.
     */
    cancel: function() {
        this.finalize(true);
    },

    /**
     * Method: click
     * Handle clicks.  Clicks are stopped from propagating to other listeners
     *     on map.events or other dom elements.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    click: function(evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },

    /**
     * Method: dblclick
     * Handle double-clicks.  Double-clicks are stopped from propagating to other
     *     listeners on map.events or other dom elements.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },
    
    /**
     * Method: modifyFeature
     * Modify the existing geometry given a pixel location.
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    modifyFeature: function(pixel) {
        var lonlat = this.map.getLonLatFromPixel(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;
        this.callback("modify", [this.point.geometry, this.point]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },

    /**
     * Method: drawFeature
     * Render features on the temporary layer.
     */
    drawFeature: function() {
        this.layer.drawFeature(this.point, this.style);
    },
    
    /**
     * Method: getGeometry
     * Return the sketch geometry.  If <multi> is true, this will return
     *     a multi-part geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry.Point>}
     */
    getGeometry: function() {
        var geometry = this.point && this.point.geometry;
        if(geometry && this.multi) {
            geometry = new OpenLayers.Geometry.MultiPoint([geometry]);
        }
        return geometry;
    },

    /**
     * Method: geometryClone
     * Return a clone of the relevant geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry>}
     */
    geometryClone: function() {
        var geom = this.getGeometry();
        return geom && geom.clone();
    },
  
    /**
     * Method: mousedown
     * Handle mouse down.  Adjust the geometry and redraw.
     * Return determines whether to propagate the event on the map.
     * 
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
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
        this.drawing = true;
        if(this.lastDown == null) {
            if(this.persist) {
                this.destroyFeature();
            }
            this.createFeature(evt.xy);
        } else {
            this.modifyFeature(evt.xy);
        }
        this.lastDown = evt.xy;
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
            this.modifyFeature(evt.xy);
        }
        return true;
    },

    /**
     * Method: mouseup
     * Handle mouse up.  Send the latest point in the geometry to the control.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns: 
     * {Boolean} Allow event propagation
     */
    mouseup: function (evt) {
        if(this.drawing) {
            this.finalize();
            return false;
        } else {
            return true;
        }
    },

    CLASS_NAME: "OpenLayers.Handler.Point"
});
