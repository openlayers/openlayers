/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Control.Split
 * Acts as a split feature agent while editing vector features.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Split = OpenLayers.Class(OpenLayers.Control, {

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
     * beforesplit - Triggered before a split occurs.  Listeners receive an
     *     event object with *source* and *target* properties.
     * split - Triggered when a split occurs.  Listeners receive an event with
     *     an *original* property and a *features* property.  The original
     *     is a reference to the target feature that the sketch or modified
     *     feature intersects.  The features property is a list of all features
     *     that result from this single split.  This event is triggered before
     *     the resulting features are added to the layer (while the layer still
     *     has a reference to the original).
     * aftersplit - Triggered after all splits resulting from a single sketch
     *     or feature modification have occurred.  The original features
     *     have been destroyed and features that result from the split
     *     have already been added to the layer.  Listeners receive an event
     *     with a *source* and *features* property.  The source references the
     *     sketch or modified feature used as a splitter.  The features
     *     property is a list of all resulting features.
     */
    EVENT_TYPES: ["beforesplit", "split", "aftersplit"],
    
    /**
     * APIProperty: layer
     * {<OpenLayers.Layer.Vector>} The target layer with features to be split.
     *     Set at construction or after construction with <setLayer>.
     */
    layer: null,
    
    /**
     * Property: source
     * {<OpenLayers.Layer.Vector>} Optional source layer.  Any newly created
     *     or modified features from this layer will be used to split features
     *     on the target layer.  If not provided, a temporary sketch layer will
     *     be created.
     */
    source: null,
    
    /**
     * Property: sourceOptions
     * {Options} If a temporary sketch layer is created, these layer options
     *     will be applied.
     */
    sourceOptions: null,

    /**
     * APIProperty: tolerance
     * {Number} Distance between the calculated intersection and a vertex on
     *     the source geometry below which the existing vertex will be used
     *     for the split.  Default is null.
     */
    tolerance: null,
    
    /**
     * APIProperty: edge
     * {Boolean} Allow splits given intersection of edges only.  Default is
     *     true.  If false, a vertex on the source must be within the
     *     <tolerance> distance of the calculated intersection for a split
     *     to occur.
     */
    edge: true,
    
    /**
     * APIProperty: deferDelete
     * {Boolean} Instead of removing features from the layer, set feature
     *     states of split features to DELETE.  This assumes a save strategy
     *     or other component is in charge of removing features from the
     *     layer.  Default is false.  If false, split features will be
     *     immediately deleted from the layer.
     */
    deferDelete: false,
    
    /**
     * APIProperty: mutual
     * {Boolean} If source and target layers are the same, split source
     *     features and target features where they intersect.  Default is
     *     true.  If false, only target features will be split.
     */
    mutual: true,
    
    /**
     * APIProperty: targetFilter
     * {OpenLayers.Filter} Optional filter that will be evaluated
     *     to determine if a feature from the target layer is eligible for
     *     splitting.
     */
    targetFilter: null,
    
    /**
     * APIProperty: sourceFilter
     * {OpenLayers.Filter} Optional filter that will be evaluated
     *     to determine if a feature from the target layer is eligible for
     *     splitting.
     */
    sourceFilter: null,
    
    /**
     * Property: handler
     * {<OpenLayers.Handler.Path>} The temporary sketch handler created if
     *     no source layer is provided.
     */
    handler: null,

    /**
     * Constructor: OpenLayers.Control.Split
     * Creates a new split control. A control is constructed with a target
     *     layer and an optional source layer. While the control is active,
     *     creating new features or modifying existing features on the source
     *     layer will result in splitting any eligible features on the target
     *     layer.  If no source layer is provided, a temporary sketch layer will
     *     be created to create lines for splitting features on the target.
     *
     * Parameters:
     * options - {Object} An object containing all configuration properties for
     *     the control.
     *
     * Valid options:
     * layer - {OpenLayers.Layer.Vector} The target layer.  Features from this
     *     layer will be split by new or modified features on the source layer
     *     or temporary sketch layer.
     * source - {OpenLayers.Layer.Vector} Optional source layer.  If provided
     *     newly created features or modified features will be used to split
     *     features on the target layer.  If not provided, a temporary sketch
     *     layer will be created for drawing lines.
     * tolerance - {Number} Optional value for the distance between a source
     *     vertex and the calculated intersection below which the split will
     *     occur at the vertex.
     * edge - {Boolean} Allow splits given intersection of edges only.  Default
     *     is true.  If false, a vertex on the source must be within the
     *     <tolerance> distance of the calculated intersection for a split
     *     to occur.
     * mutual - {Boolean} If source and target are the same, split source
     *     features and target features where they intersect.  Default is
     *     true.  If false, only target features will be split.
     * targetFilter - {OpenLayers.Filter} Optional filter that will be evaluated
     *     to determine if a feature from the target layer is eligible for
     *     splitting.
     * sourceFilter - {OpenLayers.Filter} Optional filter that will be evaluated
     *     to determine if a feature from the target layer is eligible for
     *     splitting.
     */
    initialize: function(options) {
        // concatenate events specific to measure with those from the base
        Array.prototype.push.apply(
            this.EVENT_TYPES, OpenLayers.Control.prototype.EVENT_TYPES
        );
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.options = options || {}; // TODO: this could be done by the super
        
        // set the source layer if provided
        if(this.options.source) {
            this.setSource(this.options.source);
        }
    },
    
    /**
     * APIMethod: setSource
     * Set the source layer for edits layer.
     *
     * Parameters:
     * layer - {OpenLayers.Layer.Vector}  The new source layer layer.  If
     *     null, a temporary sketch layer will be created.
     */
    setSource: function(layer) {
        if(this.active) {
            this.deactivate();
            if(this.handler) {
                this.handler.destroy();
                delete this.handler;
            }
            this.source = layer;
            this.activate();
        } else {
            this.source = layer;
        }
    },
    
    /**
     * APIMethod: activate
     * Activate the control.  Activating the control registers listeners for
     *     editing related events so that during feature creation and
     *     modification, features in the target will be considered for
     *     splitting.
     */
    activate: function() {
        var activated = OpenLayers.Control.prototype.activate.call(this);
        if(activated) {
            if(!this.source) {
                if(!this.handler) {
                    this.handler = new OpenLayers.Handler.Path(this,
                        {done: function(geometry) {
                            this.onSketchComplete({
                                feature: new OpenLayers.Feature.Vector(geometry)
                            });
                        }},
                        {layerOptions: this.sourceOptions}
                    );
                }
                this.handler.activate();
            } else if(this.source.events) {
                this.source.events.on({
                    sketchcomplete: this.onSketchComplete,
                    afterfeaturemodified: this.afterFeatureModified,
                    scope: this
                });
            }
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the control.  Deactivating the control unregisters listeners
     *     so feature editing may proceed without engaging the split agent.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Control.prototype.deactivate.call(this);
        if(deactivated) {
            if(this.source && this.source.events) {
                this.layer.events.un({
                    sketchcomplete: this.onSketchComplete,
                    afterfeaturemodified: this.afterFeatureModified,
                    scope: this
                });
            }
        }
        return deactivated;
    },
    
    /**
     * Method: onSketchComplete
     * Registered as a listener for the sketchcomplete event on the editable
     *     layer.
     *
     * Parameters:
     * event - {Object} The sketch complete event.
     *
     * Returns:
     * {Boolean} Stop the sketch from being added to the layer (it has been
     *     split).
     */
    onSketchComplete: function(event) {
        this.feature = null;
        return !this.considerSplit(event.feature);
    },
    
    /**
     * Method: afterFeatureModified
     * Registered as a listener for the afterfeaturemodified event on the
     *     editable layer.
     *
     * Parameters:
     * event - {Object} The after feature modified event.
     */
    afterFeatureModified: function(event) {
        if(event.modified) {
            var feature = event.feature;
            if(feature.geometry instanceof OpenLayers.Geometry.LineString ||
               feature.geometry instanceof OpenLayers.Geometry.MultiLineString) {
                this.feature = event.feature;
                this.considerSplit(event.feature);
            }
        }
    },
    
    /**
     * Method: removeByGeometry
     * Remove a feature from a list based on the given geometry.
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>} A list of features.
     * geometry - {<OpenLayers.Geometry>} A geometry.
     */
    removeByGeometry: function(features, geometry) {
        for(var i=0, len=features.length; i<len; ++i) {
            if(features[i].geometry === geometry) {
                features.splice(i, 1);
                break;
            }
        }
    },
    
    /**
     * Method: isEligible
     * Test if a target feature is eligible for splitting.
     *
     * Parameters:
     * target - {<OpenLayers.Feature.Vector>} The target feature.
     *
     * Returns:
     * {Boolean} The target is eligible for splitting.
     */
    isEligible: function(target) {
        return (
            target.state !== OpenLayers.State.DELETE
        ) && (
            target.geometry instanceof OpenLayers.Geometry.LineString ||
            target.geometry instanceof OpenLayers.Geometry.MultiLineString
        ) && (
            this.feature !== target
        ) && (
            !this.targetFilter ||
            this.targetFilter.evaluate(target.attributes)
        );
    },

    /**
     * Method: considerSplit
     * Decide whether or not to split target features with the supplied
     *     feature.  If <mutual> is true, both the source and target features
     *     will be split if eligible.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector}} The newly created or modified
     *     feature.
     *
     * Returns:
     * {Boolean} The supplied feature was split (and destroyed).
     */
    considerSplit: function(feature) {
        var sourceSplit = false;
        var targetSplit = false;
        if(!this.sourceFilter ||
           this.sourceFilter.evaluate(feature.attributes)) {
            var features = this.layer && this.layer.features || [];
            var target, results, proceed;
            var additions = [], removals = [];
            var mutual = (this.layer === this.source) && this.mutual;
            var options = {
                edge: this.edge,
                tolerance: this.tolerance,
                mutual: mutual
            };
            var sourceParts = [feature.geometry];
            var targetFeature, targetParts;
            var source, parts;
            for(var i=0, len=features.length; i<len; ++i) {
                targetFeature = features[i];
                if(this.isEligible(targetFeature)) {
                    targetParts = [targetFeature.geometry];
                    // work through source geoms - this array may change
                    for(var j=0; j<sourceParts.length; ++j) { 
                        source = sourceParts[j];
                        // work through target parts - this array may change
                        for(var k=0; k<targetParts.length; ++k) {
                            target = targetParts[k];
                            if(source.getBounds().intersectsBounds(target.getBounds())) {
                                results = source.split(target, options);
                                if(results) {
                                    proceed = this.events.triggerEvent(
                                        "beforesplit", {source: feature, target: targetFeature}
                                    );
                                    if(proceed !== false) {
                                        if(mutual) {
                                            parts = results[0];
                                            // handle parts that result from source splitting
                                            if(parts.length > 1) {
                                                // splice in new source parts
                                                parts.unshift(j, 1); // add args for splice below
                                                Array.prototype.splice.apply(sourceParts, parts);
                                                j += parts.length - 3;
                                            }
                                            results = results[1];
                                        }
                                        // handle parts that result from target splitting
                                        if(results.length > 1) {
                                            // splice in new target parts
                                            results.unshift(k, 1); // add args for splice below
                                            Array.prototype.splice.apply(targetParts, results);
                                            k += results.length - 3;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if(targetParts && targetParts.length > 1) {
                        this.geomsToFeatures(targetFeature, targetParts);
                        this.events.triggerEvent("split", {
                            original: targetFeature,
                            features: targetParts
                        });
                        Array.prototype.push.apply(additions, targetParts);
                        removals.push(targetFeature);
                        targetSplit = true;
                    }
                }
            }
            if(sourceParts && sourceParts.length > 1) {
                this.geomsToFeatures(feature, sourceParts);
                this.events.triggerEvent("split", {
                    original: feature,
                    features: sourceParts
                });
                Array.prototype.push.apply(additions, sourceParts);
                removals.push(feature);
                sourceSplit = true;
            }
            if(sourceSplit || targetSplit) {
                // remove and add feature events are suppressed
                // listen for split event on this control instead
                if(this.deferDelete) {
                    // Set state instead of removing.  Take care to avoid
                    // setting delete for features that have not yet been
                    // inserted - those should be destroyed immediately.
                    var feat, destroys = [];
                    for(var i=0, len=removals.length; i<len; ++i) {
                        feat = removals[i];
                        if(feat.state === OpenLayers.State.INSERT) {
                            destroys.push(feat);
                        } else {
                            feat.state = OpenLayers.State.DELETE;
                            this.layer.drawFeature(feat);
                        }
                    }
                    this.layer.destroyFeatures(destroys, {silent: true});
                    for(var i=0, len=additions.length; i<len; ++i) {
                        additions[i].state = OpenLayers.State.INSERT;
                    }
                } else {
                    this.layer.destroyFeatures(removals, {silent: true});
                }
                this.layer.addFeatures(additions, {silent: true});
                this.events.triggerEvent("aftersplit", {
                    source: feature,
                    features: additions
                });
            }
        }
        return sourceSplit;
    },
    
    /**
     * Method: geomsToFeatures
     * Create new features given a template feature and a list of geometries.
     *     The list of geometries is modified in place.  The result will be
     *     a list of new features.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature to be cloned.
     * geoms - {Array(<OpenLayers.Geometry>)} List of goemetries.  This will
     *     become a list of new features.
     */
    geomsToFeatures: function(feature, geoms) {
        var clone = feature.clone();
        delete clone.geometry;
        var newFeature;
        for(var i=0, len=geoms.length; i<len; ++i) {
            // turn results list from geoms to features
            newFeature = clone.clone();
            newFeature.geometry = geoms[i];
            newFeature.state = OpenLayers.State.INSERT;
            geoms[i] = newFeature;
        }
    },
    
    /**
     * Method: destroy
     * Clean up the control.
     */
    destroy: function() {
        if(this.active) {
            this.deactivate(); // TODO: this should be handled by the super
        }
        OpenLayers.Control.prototype.destroy.call(this);
    },

    CLASS_NAME: "OpenLayers.Control.Split"
});
