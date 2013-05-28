/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Events.js
 */

/**
 * Class: OpenLayers.Events.featureclick
 *
 * Extension event type for handling feature click events, including overlapping
 * features. 
 * 
 * Event types provided by this extension:
 * - featureclick 
 */
OpenLayers.Events.featureclick = OpenLayers.Class({
    
    /**
     * Property: cache
     * {Object} A cache of features under the mouse.
     */
    cache: null,
    
    /**
     * Property: map
     * {<OpenLayers.Map>} The map to register browser events on.
     */
    map: null,
    
    /**
     * Property: provides
     * {Array(String)} The event types provided by this extension.
     */
    provides: ["featureclick", "nofeatureclick", "featureover", "featureout"],
    
    /**
     * Constructor: OpenLayers.Events.featureclick
     * Create a new featureclick event type.
     *
     * Parameters:
     * target - {<OpenLayers.Events>} The events instance to create the events
     *     for.
     */
    initialize: function(target) {
        this.target = target;
        if (target.object instanceof OpenLayers.Map) {
            this.setMap(target.object);
        } else if (target.object instanceof OpenLayers.Layer.Vector) {
            if (target.object.map) {
                this.setMap(target.object.map);
            } else {
                target.object.events.register("added", this, function(evt) {
                    this.setMap(target.object.map);
                });
            }
        } else {
            throw("Listeners for '" + this.provides.join("', '") +
                "' events can only be registered for OpenLayers.Layer.Vector " + 
                "or OpenLayers.Map instances");
        }
        for (var i=this.provides.length-1; i>=0; --i) {
            target.extensions[this.provides[i]] = true;
        }
    },
    
    /**
     * Method: setMap
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The map to register browser events on.
     */
    setMap: function(map) {
        this.map = map;
        this.cache = {};
        map.events.register("mousedown", this, this.start, {extension: true});
        map.events.register("mouseup", this, this.onClick, {extension: true});
        map.events.register("touchstart", this, this.start, {extension: true});
        map.events.register("touchmove", this, this.cancel, {extension: true});
        map.events.register("touchend", this, this.onClick, {extension: true});
        map.events.register("mousemove", this, this.onMousemove, {extension: true});
    },
    
    /**
     * Method: start
     * Sets startEvt = evt.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    start: function(evt) {
        this.startEvt = evt;
    },
    
    /**
     * Method: cancel
     * Deletes the start event.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */    
    cancel: function(evt) {
        delete this.startEvt;
    },
    
    /**
     * Method: onClick
     * Listener for the click event.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    onClick: function(evt) {
        if (!this.startEvt || evt.type !== "touchend" &&
                !OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        var features = this.getFeatures(this.startEvt);
        delete this.startEvt;
        // fire featureclick events
        var feature, layer, more, clicked = {};
        for (var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            layer = feature.layer;
            clicked[layer.id] = true;
            more = this.triggerEvent("featureclick", {feature: feature});
            if (more === false) {
                break;
            }
        }
        // fire nofeatureclick events on all vector layers with no targets
        for (i=0, len=this.map.layers.length; i<len; ++i) {
            layer = this.map.layers[i];
            if (layer instanceof OpenLayers.Layer.Vector && !clicked[layer.id]) {
                this.triggerEvent("nofeatureclick", {layer: layer});
            }
        }
    },
    
    /**
     * Method: onMousemove
     * Listener for the mousemove event.
     *
     * Parameters:
     * evt - {<OpenLayers.Event>}
     */
    onMousemove: function(evt) {
        delete this.startEvt;
        var features = this.getFeatures(evt);
        var over = {}, newly = [], feature;
        for (var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            over[feature.id] = feature;
            if (!this.cache[feature.id]) {
                newly.push(feature);
            }
        }
        // check if already over features
        var out = [];
        for (var id in this.cache) {
            feature = this.cache[id];
            if (feature.layer && feature.layer.map) {
                if (!over[feature.id]) {
                    out.push(feature);
                }
            } else {
                // removed
                delete this.cache[id];
            }
        }
        // fire featureover events
        var more;
        for (i=0, len=newly.length; i<len; ++i) {
            feature = newly[i];
            this.cache[feature.id] = feature;
            more = this.triggerEvent("featureover", {feature: feature});
            if (more === false) {
                break;
            }
        }
        // fire featureout events
        for (i=0, len=out.length; i<len; ++i) {
            feature = out[i];
            delete this.cache[feature.id];
            more = this.triggerEvent("featureout", {feature: feature});
            if (more === false) {
                break;
            }
        }
    },
    
    /**
     * Method: triggerEvent
     * Determines where to trigger the event and triggers it.
     *
     * Parameters:
     * type - {String} The event type to trigger
     * evt - {Object} The listener argument
     *
     * Returns:
     * {Boolean} The last listener return.
     */
    triggerEvent: function(type, evt) {
        var layer = evt.feature ? evt.feature.layer : evt.layer,
            object = this.target.object;
        if (object instanceof OpenLayers.Map || object === layer) {
            return this.target.triggerEvent(type, evt);
        }
    },

    /**
     * Method: getFeatures
     * Get all features at the given screen location.
     *
     * Parameters:
     * evt - {Object} Event object.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features at the given point.
     */
    getFeatures: function(evt) {
        var x = evt.clientX, y = evt.clientY,
            features = [], targets = [], layers = [],
            layer, target, feature, i, len;
        // go through all layers looking for targets
        for (i=this.map.layers.length-1; i>=0; --i) {
            layer = this.map.layers[i];
            if (layer.div.style.display !== "none") {
                if (layer.renderer instanceof OpenLayers.Renderer.Elements) {
                    if (layer instanceof OpenLayers.Layer.Vector) {
                        target = document.elementFromPoint(x, y);
                        while (target && target._featureId) {
                            feature = layer.getFeatureById(target._featureId);
                            if (feature) {
                                features.push(feature);
                                target.style.display = "none";
                                targets.push(target);
                                target = document.elementFromPoint(x, y);
                            } else {
                                // sketch, all bets off
                                target = false;
                            }
                        }
                    }
                    layers.push(layer);
                    layer.div.style.display = "none";
                } else if (layer.renderer instanceof OpenLayers.Renderer.Canvas) {
                    feature = layer.renderer.getFeatureIdFromEvent(evt);
                    if (feature) {
                        features.push(feature);
                        layers.push(layer);
                    }
                }
            }
        }
        // restore feature visibility
        for (i=0, len=targets.length; i<len; ++i) {
            targets[i].style.display = "";
        }
        // restore layer visibility
        for (i=layers.length-1; i>=0; --i) {
            layers[i].div.style.display = "block";
        }
        return features;
    },
    
    /**
     * APIMethod: destroy
     * Clean up.
     */
    destroy: function() {
        for (var i=this.provides.length-1; i>=0; --i) {
            delete this.target.extensions[this.provides[i]];
        }        
        this.map.events.un({
            mousemove: this.onMousemove,
            mousedown: this.start,
            mouseup: this.onClick,
            touchstart: this.start,
            touchmove: this.cancel,
            touchend: this.onClick,
            scope: this
        });
        delete this.cache;
        delete this.map;
        delete this.target;
    }
    
});
 
/**
 * Class: OpenLayers.Events.nofeatureclick
 *
 * Extension event type for handling click events that do not hit a feature. 
 * 
 * Event types provided by this extension:
 * - nofeatureclick 
 */
OpenLayers.Events.nofeatureclick = OpenLayers.Events.featureclick;

/**
 * Class: OpenLayers.Events.featureover
 *
 * Extension event type for handling hovering over a feature. 
 * 
 * Event types provided by this extension:
 * - featureover 
 */
OpenLayers.Events.featureover = OpenLayers.Events.featureclick;

/**
 * Class: OpenLayers.Events.featureout
 *
 * Extension event type for handling leaving a feature. 
 * 
 * Event types provided by this extension:
 * - featureout 
 */
OpenLayers.Events.featureout = OpenLayers.Events.featureclick;
