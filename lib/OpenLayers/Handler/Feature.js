/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Handler to respond to mouse events related to a drawn feature.
 * Callbacks will be called for over, move, out, up, and down (corresponding
 * to the equivalent mouse events).
 * 
 * @class
 * @requires OpenLayers/Handler.js
 */
OpenLayers.Handler.Feature = OpenLayers.Class.create();
OpenLayers.Handler.Feature.prototype =
  OpenLayers.Class.inherit(OpenLayers.Handler, {
    
    /**
     * @type {Int}
     */
    layerIndex: null,
    
    /**
     * @type {OpenLayers.Geometry}
     */
    geometry: null,
    
    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Array} layers List of OpenLayers.Layer.Vector
     * @param {Array} callbacks An object with a 'over' property whos value is
     *                          a function to be called when the mouse is over
     *                          a feature. The callback should expect to recieve
     *                          a single argument, the geometry.
     * @param {Object} options
     */
    initialize: function(control, layer, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, [control, callbacks, options]);
        this.layer = layer;
    },

    /**
     * Handle mouse down.  Call the "down" callback if down on a feature.
     * 
     * @param {Event} evt
     */
    mousedown: function(evt) {
        var selected = this.select('down', evt);
        return !selected;  // stop event propagation if selected
    },
    
    /**
     * Handle mouse moves.  Call the "move" callback if moving over a feature.
     * Call the "over" callback if moving over a feature for the first time.
     * Call the "out" callback if moving off of a feature.
     * 
     * @param {Event} evt
     */
    mousemove: function(evt) {
        this.select('move', evt);
        return true;
    },

    /**
     * Handle mouse moves.  Call the "up" callback if up on a feature.
     * 
     * @param {Event} evt
     */
    mouseup: function(evt) {
        var selected = this.select('up', evt);
        return !selected;  // stop event propagation if selected        
    },
    
    /**
     * Capture double-clicks.  Let the event continue propagating if the 
     * double-click doesn't hit a geometry.  Otherwise call the dblclick
     * callback.
     *
     * @param {Event} evt
     */
    dblclick: function(evt) {
        var selected = this.select('dblclick', evt);
        return !selected;  // stop event propagation if selected        
    },

    /**
     * Trigger the appropriate callback if a feature is under the mouse.
     *
     * @param {String} type Callback key
     * @type {Boolean} A feature was selected
     */
    select: function(type, evt) {    
        var geometry = this.layer.renderer.getGeometryFromEvent(evt);
        if(geometry) {
            // three cases:
            // over a new, out of the last and over a new, or still on the last
            if(!this.geometry) {
                // over a new geometry
                this.callback('over', [geometry]);
            } else if(this.geometry != geometry) {
                // out of the last and over a new
                this.callback('out', [this.geometry]);
                this.callback('over', [geometry]);
            }
            this.geometry = geometry;
            this.callback(type, [geometry]);
            return true;
        } else {
            if(this.geometry) {
                // out of the last
                this.callback('out', [this.geometry]);
                this.geometry = null;
            }
            return false;
        }
    },

    /**
     * Turn on the handler.  Returns false if the handler was already active.
     *
     * @type {Boolean}
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
     * Turn onf the handler.  Returns false if the handler was already active.
     *
     * @type {Boolean}
     */
    deactivate: function() {
        if(OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            this.layer.div.style.zIndex = this.layerIndex;
            return true;
        } else {
            return false;
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.Feature"
});
