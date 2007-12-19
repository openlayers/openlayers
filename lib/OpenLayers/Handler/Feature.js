/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Handler.js
 * 
 * Class: OpenLayers.Handler.Feature 
 * Handler to respond to mouse events related to a drawn feature.  Callbacks
 *     with the following keys will be notified of the following events
 *     associated with features: click, clickout, over, out, and dblclick.
 *
 * This handler stops event propagation for mousedown and mouseup if those
 *     browser events target features that can be selected.
 */
OpenLayers.Handler.Feature = OpenLayers.Class(OpenLayers.Handler, {

    /**
     * Property: EVENTMAP
     * {Object} A object mapping the browser events to objects with callback
     *     keys for in and out.
     */
    EVENTMAP: {
        'click': {'in': 'click', 'out': 'clickout'},
        'mousemove': {'in': 'over', 'out': 'out'},
        'dblclick': {'in': 'dblclick', 'out': null},
        'mousedown': {'in': null, 'out': null},
        'mouseup': {'in': null, 'out': null}
    },

    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>} The last feature that was handled.
     */
    feature: null,

    /**
     * Property: down
     * {<OpenLayers.Pixel>} The location of the last mousedown.
     */
    down: null,

    /**
     * Property: up
     * {<OpenLayers.Pixel>} The location of the last mouseup.
     */
    up: null,
    
    /**
     * Property: clickoutTolerance
     * {Number} The number of pixels the mouse can move during a click that
     *     still constitutes a click out.  When dragging the map, clicks should
     *     not trigger the clickout property unless this tolerance is reached.
     *     Default is 4.
     */
    clickoutTolerance: 4,

    /**
     * Property: geometryTypes
     * To restrict dragging to a limited set of geometry types, send a list
     * of strings corresponding to the geometry class names.
     * 
     * @type Array(String)
     */
    geometryTypes: null,
    
    /**
     * Property: layerIndex
     * {Int}
     */
    layerIndex: null,
    
    /**
     * Constructor: OpenLayers.Handler.Feature
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 
     * layers - {Array(<OpenLayers.Layer.Vector>)}
     * callbacks - {Object} An object with a 'over' property whos value is
     *     a function to be called when the mouse is over a feature. The 
     *     callback should expect to recieve a single argument, the feature.
     * options - {Object} 
     */
    initialize: function(control, layer, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, [control, callbacks, options]);
        this.layer = layer;
    },


    /**
     * Method: mousedown
     * Handle mouse down.  Stop propagation if a feature is targeted by this
     *     event (stops map dragging during feature selection).
     * 
     * Parameters:
     * evt - {Event} 
     */
    mousedown: function(evt) {
        this.down = evt.xy;
        return !this.handle(evt);
    },
    
    /**
     * Method: mouseup
     * Handle mouse up.  Stop propagation if a feature is targeted by this
     *     event.
     * 
     * Parameters:
     * evt - {Event} 
     */
    mouseup: function(evt) {
        this.up = evt.xy;
        return !this.handle(evt);
    },

    /**
     * Method: click
     * Handle click.  Call the "click" callback if click on a feature,
     *     or the "clickout" callback if click outside any feature.
     * 
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {Boolean}
     */
    click: function(evt) {
        return !this.handle(evt);
    },
        
    /**
     * Method: mousemove
     * Handle mouse moves.  Call the "over" callback if move over a feature,
     *     or the "out" callback if move outside any feature.
     * 
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {Boolean}
     */
    mousemove: function(evt) {
        this.handle(evt);
        return true;
    },
    
    /**
     * Method: dblclick
     * Handle dblclick.  Call the "dblclick" callback if dblclick on a feature.
     *
     * Parameters:
     * evt - {Event} 
     *
     * Returns:
     * {Boolean}
     */
    dblclick: function(evt) {
        return !this.handle(evt);
    },

    /**
     * Method: geometryTypeMatches
     * Return true if the geometry type of the passed feature matches
     *     one of the geometry types in the geometryTypes array.
     *
     * Parameters:
     * feature - {<OpenLayers.Vector.Feature>}
     *
     * Returns:
     * {Boolean}
     */
    geometryTypeMatches: function(feature) {
        return this.geometryTypes == null ||
            OpenLayers.Util.indexOf(this.geometryTypes,
                                    feature.geometry.CLASS_NAME) > -1;
    },

    /**
     * Method: handle
     *
     * Parameters:
     * evt - {Event}
     *
     * Returns:
     * {Boolean} Stop event propagation.
     */
    handle: function(evt) {
        var type = evt.type;
        var stopEvtPropag = false;
        var lastFeature = this.feature;
        var feature = this.layer.getFeatureFromEvent(evt);
        if(feature) {
            if(this.geometryTypeMatches(feature)) {
                if(lastFeature && (lastFeature != feature)) {
                    // out of last feature
                    this.triggerCallback(type, 'out', [lastFeature]);
                }
                this.triggerCallback(type, 'in', [feature]);
                lastFeature = feature;
                stopEvtPropag = true;
            } else {
                if(lastFeature && (lastFeature != feature)) {
                    // out of last feature
                    this.triggerCallback(type, 'out', [lastFeature]);
                    lastFeature = feature;
                }
            }
        } else {
            if(lastFeature) {
                this.triggerCallback(type, 'out', [lastFeature]);
                lastFeature = null;
            }
        }
        if(lastFeature) {
            this.feature = lastFeature;
        }
        return stopEvtPropag;
    },
    
    /**
     * Method: triggerCallback
     * Call the callback keyed in the event map with the supplied arguments.
     *     For click out, the <clickoutTolerance> is checked first.
     *
     * Parameters:
     * type - {String}
     */
    triggerCallback: function(type, mode, args) {
        var key = this.EVENTMAP[type][mode];
        if(key) {
            if(type == 'click' && mode == 'out' && this.up && this.down) {
                // for clickout, only trigger callback if tolerance is met
                var dpx = Math.sqrt(
                    Math.pow(this.up.x - this.down.x, 2) +
                    Math.pow(this.up.y - this.down.y, 2)
                );
                if(dpx <= this.clickoutTolerance) {
                    this.callback(key, args);
                }
            } else {
                this.callback(key, args);
            }
        }
    },

    /**
     * Method: activate 
     * Turn on the handler.  Returns false if the handler was already active.
     *
     * Returns:
     * {Boolean}
     */
    activate: function() {
        var activated = false;
        if(OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            this.layerIndex = this.layer.div.style.zIndex;
            this.layer.div.style.zIndex = this.map.Z_INDEX_BASE['Popup'] - 1;
            activated = true;
        }
        return activated;
    },
    
    /**
     * Method: activate 
     * Turn of the handler.  Returns false if the handler was already active.
     *
     * Returns: 
     * {Boolean}
     */
    deactivate: function() {
        var deactivated = false;
        if(OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            if (this.layer && this.layer.div) {
                this.layer.div.style.zIndex = this.layerIndex;
            }
            this.feature = null;
            this.down = null;
            this.up = null;
            deactivated = true;
        }
        return deactivated;
    },

    CLASS_NAME: "OpenLayers.Handler.Feature"
});
