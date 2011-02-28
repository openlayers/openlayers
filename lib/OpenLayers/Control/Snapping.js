/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Control.Snapping
 * Acts as a snapping agent while editing vector features.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Snapping = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Listeners will be called with a reference to an event object.  The
     *     properties of this event depends on exactly what happened.
     *
     * Supported control event types (in addition to those from <OpenLayers.Control>):
     * beforesnap - Triggered before a snap occurs.  Listeners receive an
     *     event object with *point*, *x*, *y*, *distance*, *layer*, and
     *     *snapType* properties.  The point property will be original point
     *     geometry considered for snapping. The x and y properties represent
     *     coordinates the point will receive. The distance is the distance
     *     of the snap.  The layer is the target layer.  The snapType property
     *     will be one of "node", "vertex", or "edge". Return false to stop
     *     snapping from occurring.
     * snap - Triggered when a snap occurs.  Listeners receive an event with
     *     *point*, *snapType*, *layer*, and *distance* properties.  The point
     *     will be the location snapped to.  The snapType will be one of "node",
     *     "vertex", or "edge".  The layer will be the target layer.  The
     *     distance will be the distance of the snap in map units.
     * unsnap - Triggered when a vertex is unsnapped.  Listeners receive an
     *     event with a *point* property.
     */
    EVENT_TYPES: ["beforesnap", "snap", "unsnap"],
    
    /**
     * CONSTANT: DEFAULTS
     * Default target properties.
     */
    DEFAULTS: {
        tolerance: 10,
        node: true,
        edge: true,
        vertex: true
    },
    
    /**
     * Property: greedy
     * {Boolean} Snap to closest feature in first layer with an eligible
     *     feature.  Default is true.
     */
    greedy: true,
    
    /**
     * Property: precedence
     * {Array} List representing precedence of different snapping types.
     *     Default is "node", "vertex", "edge".
     */
    precedence: ["node", "vertex", "edge"],
    
    /**
     * Property: resolution
     * {Float} The map resolution for the previously considered snap.
     */
    resolution: null,
    
    /**
     * Property: geoToleranceCache
     * {Object} A cache of geo-tolerances.  Tolerance values (in map units) are
     *     calculated when the map resolution changes.
     */
    geoToleranceCache: null,
    
    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>} The current editable layer.  Set at
     *     construction or after construction with <setLayer>.
     */
    layer: null,
    
    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>} The current editable feature.
     */
    feature: null,
    
    /**
     * Property: point
     * {<OpenLayers.Geometry.Point>} The currently snapped vertex.
     */
    point: null,

    /**
     * Constructor: OpenLayers.Control.Snapping
     * Creates a new snapping control. A control is constructed with an editable
     *     layer and a set of configuration objects for target layers. While the
     *     control is active, dragging vertices while drawing new features or
     *     modifying existing features on the editable layer will engage
     *     snapping to features on the target layers. Whether a vertex snaps to
     *     a feature on a target layer depends on the target layer configuration.
     *
     * Parameters:
     * options - {Object} An object containing all configuration properties for
     *     the control.
     *
     * Valid options:
     * layer - {OpenLayers.Layer.Vector} The editable layer.  Features from this
     *     layer that are digitized or modified may have vertices snapped to
     *     features from any of the target layers.
     * targets - {Array(Object | OpenLayers.Layer.Vector)} A list of objects for
     *     configuring target layers.  See valid properties of the target
     *     objects below.  If the items in the targets list are vector layers
     *     (instead of configuration objects), the defaults from the <defaults>
     *     property will apply.  The editable layer itself may be a target
     *     layer - allowing newly created or edited features to be snapped to
     *     existing features from the same layer.  If no targets are provided
     *     the layer given in the constructor (as <layer>) will become the
     *     initial target.
     * defaults - {Object} An object with default properties to be applied
     *     to all target objects.
     * greedy - {Boolean} Snap to closest feature in first target layer that
     *     applies.  Default is true.  If false, all features in all target
     *     layers will be checked and the closest feature in all target layers
     *     will be chosen.  The greedy property determines if the order of the
     *     target layers is significant.  By default, the order of the target
     *     layers is significant where layers earlier in the target layer list
     *     have precedence over layers later in the list.  Within a single
     *     layer, the closest feature is always chosen for snapping.  This
     *     property only determines whether the search for a closer feature
     *     continues after an eligible feature is found in a target layer.
     *
     * Valid target properties:
     * layer - {OpenLayers.Layer.Vector} A target layer.  Features from this
     *     layer will be eligible to act as snapping target for the editable
     *     layer.
     * tolerance - {Float} The distance (in pixels) at which snapping may occur.
     *     Default is 10.
     * node - {Boolean} Snap to nodes (first or last point in a geometry) in
     *     target layer.  Default is true.
     * nodeTolerance - {Float} Optional distance at which snapping may occur
     *     for nodes specifically.  If none is provided, <tolerance> will be
     *     used.
     * vertex - {Boolean} Snap to vertices in target layer.  Default is true.
     * vertexTolerance - {Float} Optional distance at which snapping may occur
     *     for vertices specifically.  If none is provided, <tolerance> will be
     *     used.
     * edge - {Boolean} Snap to edges in target layer.  Default is true.
     * edgeTolerance - {Float} Optional distance at which snapping may occur
     *     for edges specifically.  If none is provided, <tolerance> will be
     *     used.
     * filter - {OpenLayers.Filter} Optional filter to evaluate to determine if
     *     feature is eligible for snapping.  If filter evaluates to true for a
     *     target feature a vertex may be snapped to the feature. 
     * minResolution - {Number} If a minResolution is provided, snapping to this
     *     target will only be considered if the map resolution is greater than
     *     or equal to this value (the minResolution is inclusive).  Default is
     *     no minimum resolution limit.
     * maxResolution - {Number} If a maxResolution is provided, snapping to this
     *     target will only be considered if the map resolution is strictly
     *     less than this value (the maxResolution is exclusive).  Default is
     *     no maximum resolution limit.
     */
    initialize: function(options) {
        // concatenate events specific to measure with those from the base
        Array.prototype.push.apply(
            this.EVENT_TYPES, OpenLayers.Control.prototype.EVENT_TYPES
        );
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.options = options || {}; // TODO: this could be done by the super
        
        // set the editable layer if provided
        if(this.options.layer) {
            this.setLayer(this.options.layer);
        }
        // configure target layers
        var defaults = OpenLayers.Util.extend({}, this.options.defaults);
        this.defaults = OpenLayers.Util.applyDefaults(defaults, this.DEFAULTS);
        this.setTargets(this.options.targets);
        if(this.targets.length === 0 && this.layer) {
            this.addTargetLayer(this.layer);
        }

        this.geoToleranceCache = {};
    },
    
    /**
     * APIMethod: setLayer
     * Set the editable layer.  Call the setLayer method if the editable layer
     *     changes and the same control should be used on a new editable layer.
     *     If the control is already active, it will be active after the new
     *     layer is set.
     *
     * Parameters:
     * layer - {OpenLayers.Layer.Vector}  The new editable layer.
     */
    setLayer: function(layer) {
        if(this.active) {
            this.deactivate();
            this.layer = layer;
            this.activate();
        } else {
            this.layer = layer;
        }
    },
    
    /**
     * Method: setTargets
     * Set the targets for the snapping agent.
     *
     * Parameters:
     * targets - {Array} An array of target configs or target layers.
     */
    setTargets: function(targets) {
        this.targets = [];
        if(targets && targets.length) {
            var target;
            for(var i=0, len=targets.length; i<len; ++i) {
                target = targets[i];
                if(target instanceof OpenLayers.Layer.Vector) {
                    this.addTargetLayer(target);
                } else {
                    this.addTarget(target);
                }
            }
        }
    },
    
    /**
     * Method: addTargetLayer
     * Add a target layer with the default target config.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} A target layer.
     */
    addTargetLayer: function(layer) {
        this.addTarget({layer: layer});
    },
    
    /**
     * Method: addTarget
     * Add a configured target layer.
     *
     * Parameters:
     * target - {Object} A target config.
     */
    addTarget: function(target) {
        target = OpenLayers.Util.applyDefaults(target, this.defaults);
        target.nodeTolerance = target.nodeTolerance || target.tolerance;
        target.vertexTolerance = target.vertexTolerance || target.tolerance;
        target.edgeTolerance = target.edgeTolerance || target.tolerance;
        this.targets.push(target);
    },
    
    /**
     * Method: removeTargetLayer
     * Remove a target layer.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} The target layer to remove.
     */
    removeTargetLayer: function(layer) {
        var target;
        for(var i=this.targets.length-1; i>=0; --i) {
            target = this.targets[i];
            if(target.layer === layer) {
                this.removeTarget(target);
            }
        }
    },
    
    /**
     * Method: removeTarget
     * Remove a target.
     *
     * Parameters:
     * target - {Object} A target config.
     *
     * Returns:
     * {Array} The targets array.
     */
    removeTarget: function(target) {
        return OpenLayers.Util.removeItem(this.targets, target);
    },
    
    /**
     * APIMethod: activate
     * Activate the control.  Activating the control registers listeners for
     *     editing related events so that during feature creation and
     *     modification, moving vertices will trigger snapping.
     */
    activate: function() {
        var activated = OpenLayers.Control.prototype.activate.call(this);
        if(activated) {
            if(this.layer && this.layer.events) {
                this.layer.events.on({
                    sketchstarted: this.onSketchModified,
                    sketchmodified: this.onSketchModified,
                    vertexmodified: this.onVertexModified,
                    scope: this
                });
            }
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the control.  Deactivating the control unregisters listeners
     *     so feature editing may proceed without engaging the snapping agent.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
        if(deactivated) {
            if(this.layer && this.layer.events) {
                this.layer.events.un({
                    sketchstarted: this.onSketchModified,
                    sketchmodified: this.onSketchModified,
                    vertexmodified: this.onVertexModified,
                    scope: this
                });
            }
        }
        this.feature = null;
        this.point = null;
        return deactivated;
    },
    
    /**
     * Method: onSketchModified
     * Registered as a listener for the sketchmodified event on the editable
     *     layer.
     *
     * Parameters:
     * event - {Object} The sketch modified event.
     */
    onSketchModified: function(event) {
        this.feature = event.feature;
        this.considerSnapping(event.vertex, event.vertex);
    },
    
    /**
     * Method: onVertexModified
     * Registered as a listener for the vertexmodified event on the editable
     *     layer.
     *
     * Parameters:
     * event - {Object} The vertex modified event.
     */
    onVertexModified: function(event) {
        this.feature = event.feature;
        var loc = this.layer.map.getLonLatFromViewPortPx(event.pixel);
        this.considerSnapping(
            event.vertex, new OpenLayers.Geometry.Point(loc.lon, loc.lat)
        );
    },

    /**
     * Method: considerSnapping
     *
     * Parameters:
     * point - {<OpenLayers.Geometry.Point>} The vertex to be snapped (or
     *     unsnapped).
     * loc - {<OpenLayers.Geometry.Point>} The location of the mouse in map
     *     coords.
     */
    considerSnapping: function(point, loc) {
        var best = {
            rank: Number.POSITIVE_INFINITY,
            dist: Number.POSITIVE_INFINITY,
            x: null, y: null
        };
        var snapped = false;
        var result, target;
        for(var i=0, len=this.targets.length; i<len; ++i) {
            target = this.targets[i];
            result = this.testTarget(target, loc);
            if(result) {
                if(this.greedy) {
                    best = result;
                    best.target = target; 
                    snapped = true;
                    break;
                } else {
                    if((result.rank < best.rank) ||
                       (result.rank === best.rank && result.dist < best.dist)) {
                        best = result;
                        best.target = target;
                        snapped = true;
                    }
                }
            }
        }
        if(snapped) {
            var proceed = this.events.triggerEvent("beforesnap", {
                point: point, x: best.x, y: best.y, distance: best.dist,
                layer: best.target.layer, snapType: this.precedence[best.rank]
            });
            if(proceed !== false) {
                point.x = best.x;
                point.y = best.y;
                this.point = point;
                this.events.triggerEvent("snap", {
                    point: point,
                    snapType: this.precedence[best.rank],
                    layer: best.target.layer,
                    distance: best.dist
                });
            } else {
                snapped = false;
            }
        }
        if(this.point && !snapped) {
            point.x = loc.x;
            point.y = loc.y;
            this.point = null;
            this.events.triggerEvent("unsnap", {point: point});
        }
    },
    
    /**
     * Method: testTarget
     *
     * Parameters:
     * target - {Object} Object with target layer configuration.
     * loc - {<OpenLayers.Geometry.Point>} The location of the mouse in map
     *     coords.
     *
     * Returns:
     * {Object} A result object with rank, dist, x, and y properties.
     *     Returns null if candidate is not eligible for snapping.
     */
    testTarget: function(target, loc) {
        var resolution = this.layer.map.getResolution();
        if ("minResolution" in target) {
            if (resolution < target.minResolution) {
                return null;
            }
        }
        if ("maxResolution" in target) {
            if (resolution >= target.maxResolution) {
                return null;
            }
        }
        var tolerance = {
            node: this.getGeoTolerance(target.nodeTolerance, resolution),
            vertex: this.getGeoTolerance(target.vertexTolerance, resolution),
            edge: this.getGeoTolerance(target.edgeTolerance, resolution)
        };
        // this could be cached if we don't support setting tolerance values directly
        var maxTolerance = Math.max(
            tolerance.node, tolerance.vertex, tolerance.edge
        );
        var result = {
            rank: Number.POSITIVE_INFINITY, dist: Number.POSITIVE_INFINITY
        };
        var eligible = false;
        var features = target.layer.features;
        var feature, type, vertices, vertex, closest, dist, found;
        var numTypes = this.precedence.length;
        var ll = new OpenLayers.LonLat(loc.x, loc.y);
        for(var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            if(feature !== this.feature && !feature._sketch &&
               feature.state !== OpenLayers.State.DELETE &&
               (!target.filter || target.filter.evaluate(feature.attributes))) {
                if(feature.atPoint(ll, maxTolerance, maxTolerance)) {
                    for(var j=0, stop=Math.min(result.rank+1, numTypes); j<stop; ++j) {
                        type = this.precedence[j];
                        if(target[type]) {
                            if(type === "edge") {
                                closest = feature.geometry.distanceTo(loc, {details: true});
                                dist = closest.distance;
                                if(dist <= tolerance[type] && dist < result.dist) {
                                    result = {
                                        rank: j, dist: dist,
                                        x: closest.x0, y: closest.y0 // closest coords on feature
                                    };
                                    eligible = true;
                                    // don't look for lower precedence types for this feature
                                    break;
                                }
                            } else {
                                // look for nodes or vertices
                                vertices = feature.geometry.getVertices(type === "node");
                                found = false;
                                for(var k=0, klen=vertices.length; k<klen; ++k) {
                                    vertex = vertices[k];
                                    dist = vertex.distanceTo(loc);
                                    if(dist <= tolerance[type] &&
                                       (j < result.rank || (j === result.rank && dist < result.dist))) {
                                        result = {
                                            rank: j, dist: dist,
                                            x: vertex.x, y: vertex.y
                                        };
                                        eligible = true;
                                        found = true;
                                    }
                                }
                                if(found) {
                                    // don't look for lower precedence types for this feature
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        return eligible ? result : null;
    },
    
    /**
     * Method: getGeoTolerance
     * Calculate a tolerance in map units given a tolerance in pixels.  This
     *     takes advantage of the <geoToleranceCache> when the map resolution
     *     has not changed.
     *     
     * Parameters:
     * tolerance - {Number} A tolerance value in pixels.
     * resolution - {Number} Map resolution.
     *
     * Returns:
     * {Number} A tolerance value in map units.
     */
    getGeoTolerance: function(tolerance, resolution) {
        if(resolution !== this.resolution) {
            this.resolution = resolution;
            this.geoToleranceCache = {};
        }
        var geoTolerance = this.geoToleranceCache[tolerance];
        if(geoTolerance === undefined) {
            geoTolerance = tolerance * resolution;
            this.geoToleranceCache[tolerance] = geoTolerance;
        }
        return geoTolerance;
    },
    
    /**
     * Method: destroy
     * Clean up the control.
     */
    destroy: function() {
        if(this.active) {
            this.deactivate(); // TODO: this should be handled by the super
        }
        delete this.layer;
        delete this.targets;
        OpenLayers.Control.prototype.destroy.call(this);
    },

    CLASS_NAME: "OpenLayers.Control.Snapping"
});
