/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * Handler to draw a path on the map.  Polygon is displayed on mouse down,
 * moves on mouse move, and is finished on mouse up.
 * 
 * @class
 * @requires OpenLayers/Handler.js
 */
OpenLayers.Handler.Select = OpenLayers.Class.create();
OpenLayers.Handler.Select.prototype =
  OpenLayers.Class.inherit(OpenLayers.Handler, {
    
    /**
     * @type {Int}
     */
    layerIndex: null,
    
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
     * Handle mouse down.  Call the "up" callback if down on a feature.
     * 
     * @param {Event} evt
     */
    mousedown: function(evt) {
        return this.select('down', evt);
    },
    
    /**
     * Handle mouse moves.  Call the "over" callback if over a feature.
     * 
     * @param {Event} evt
     */
    mousemove: function(evt) {
        this.select('move', evt);
        return true;
    },

    /**
     * Handle mouse moves.  Call the "down" callback if up on a feature.
     * 
     * @param {Event} evt
     */
    mouseup: function(evt) {
        return this.select('up', evt);
    },
    
    /**
     * Capture double-clicks.
     *
     */
    dblclick: function(evt) {
        return false;
    },

    /**
     * Trigger the appropriate callback if a feature is under the mouse.
     *
     * @param {String} type Callback key
     */
    select: function(type, evt) {    
        var geometry = this.layer.renderer.getGeometryFromEvent(evt);
        if(geometry) {
            if (geometry.parent) {
                geometry = geometry.parent;
            }    
            this.callback(type, [geometry]);
            return false; // stop event propagation
        }
        return true;
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
    CLASS_NAME: "OpenLayers.Handler.Select"
});
