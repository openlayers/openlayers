/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Handler.js
 * 
 * Class: OpenLayers.Handler.Feature 
 * Handler to respond to mouse events related to a drawn feature.
 * Callbacks will be called for over, move, out, up, down, and click
 * (corresponding to the equivalent mouse events).
 */
OpenLayers.Handler.Feature = OpenLayers.Class(OpenLayers.Handler, {

    /**
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
     * Property: feature
     * {<OpenLayers.Feature.Vector>}
     */
    feature: null,
    
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
     * Method: click
     * Handle click.  Call the "click" callback if down on a feature.
     * 
     * Parameters:
     * evt - {Event} 
     */
    click: function(evt) {
        var selected = this.select('click', evt);
        return !selected;  // stop event propagation if selected
    },

    /**
     * Method: mousedown
     * Handle mouse down.  Call the "down" callback if down on a feature.
     * 
     * Parameters:
     * evt - {Event} 
     */
    mousedown: function(evt) {
        var selected = this.select('down', evt);
        return !selected;  // stop event propagation if selected
    },
    
    /**
     * Method: mousemove
     * Handle mouse moves.  Call the "move" callback if moving over a feature.
     * Call the "over" callback if moving over a feature for the first time.
     * Call the "out" callback if moving off of a feature.
     * 
     * Parameters:
     * evt - {Event} 
     */
    mousemove: function(evt) {
        this.select('move', evt);
        return true;
    },

    /**
     * Method: mouseup
     * Handle mouse up.  Call the "up" callback if up on a feature.
     * 
     * Parameters:
     * evt - {Event} 
     */
    mouseup: function(evt) {
        var selected = this.select('up', evt);
        return !selected;  // stop event propagation if selected        
    },
    
    /**
     * Method: dblclick
     * Capture double-clicks.  Let the event continue propagating if the 
     *     double-click doesn't hit a feature.  Otherwise call the dblclick
     *     callback.
     *
     * Parameters:
     * evt - {Event} 
     */
    dblclick: function(evt) {
        var selected = this.select('dblclick', evt);
        return !selected;  // stop event propagation if selected        
    },

    /**
     * Method: select
     * Trigger the appropriate callback if a feature is under the mouse.
     *
     * Parameters:
     * type - {String} Callback key
     *
     * Returns:
     * {Boolean} A feature was selected
     */
    select: function(type, evt) {
        var feature = this.layer.getFeatureFromEvent(evt);
        var selected = false;
        if(feature) {
            if(this.geometryTypes == null ||
               (OpenLayers.Util.indexOf(this.geometryTypes,
                                        feature.geometry.CLASS_NAME) > -1)) {
                // three cases:
                // over a new, out of the last and over a new, or still on the last
                if(!this.feature) {
                    // over a new feature
                    this.callback('over', [feature]);
                } else if(this.feature != feature) {
                    // out of the last and over a new
                    this.callback('out', [this.feature]);
                    this.callback('over', [feature]);
                }
                this.feature = feature;
                this.callback(type, [feature]);
                selected = true;
            } else {
                if(this.feature && (this.feature != feature)) {
                    // out of the last and over a new
                    this.callback('out', [this.feature]);
                    this.feature = null;
                }
                selected = false;
            }
        } else {
            if(this.feature) {
                // out of the last
                this.callback('out', [this.feature]);
                this.feature = null;
            }
            selected = false;
        }
        return selected;
    },

    /**
     * Method: activate 
     * Turn on the handler.  Returns false if the handler was already active.
     *
     * Returns:
     * {Boolean}
     */
    activate: function() {
        if(OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            this.layerIndex = this.layer.div.style.zIndex;
            this.layer.div.style.zIndex = this.map.Z_INDEX_BASE['Popup'] - 1;
            return true;
        } else {
            return false;
        }
    },
    
    /**
     * Method: activate 
     * Turn of the handler.  Returns false if the handler was already active.
     *
     * Returns: 
     * {Boolean}
     */
    deactivate: function() {
        if(OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            if (this.layer && this.layer.div) {
                this.layer.div.style.zIndex = this.layerIndex;
            }    
            return true;
        } else {
            return false;
        }
    },

    CLASS_NAME: "OpenLayers.Handler.Feature"
});
