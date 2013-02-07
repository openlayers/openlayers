/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 */

/**
 * Class: OpenLayers.Strategy
 * Abstract vector layer strategy class.  Not to be instantiated directly.  Use
 *     one of the strategy subclasses instead.
 */
OpenLayers.Strategy = OpenLayers.Class({
    
    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>} The layer this strategy belongs to.
     */
    layer: null,
    
    /**
     * Property: options
     * {Object} Any options sent to the constructor.
     */
    options: null,

    /** 
     * Property: active 
     * {Boolean} The control is active.
     */
    active: null,

    /**
     * Property: autoActivate
     * {Boolean} The creator of the strategy can set autoActivate to false
     *      to fully control when the protocol is activated and deactivated.
     *      Defaults to true.
     */
    autoActivate: true,

    /**
     * Property: autoDestroy
     * {Boolean} The creator of the strategy can set autoDestroy to false
     *      to fully control when the strategy is destroyed. Defaults to
     *      true.
     */
    autoDestroy: true,

    /**
     * Constructor: OpenLayers.Strategy
     * Abstract class for vector strategies.  Create instances of a subclass.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
        // set the active property here, so that user cannot override it
        this.active = false;
    },
    
    /**
     * APIMethod: destroy
     * Clean up the strategy.
     */
    destroy: function() {
        this.deactivate();
        this.layer = null;
        this.options = null;
    },

    /**
     * Method: setLayer
     * Called to set the <layer> property.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>}
     */
    setLayer: function(layer) {
        this.layer = layer;
    },
    
    /**
     * Method: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     *
     * Returns:
     * {Boolean} True if the strategy was successfully activated or false if
     *      the strategy was already active.
     */
    activate: function() {
        if (!this.active) {
            this.active = true;
            return true;
        }
        return false;
    },
    
    /**
     * Method: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     *
     * Returns:
     * {Boolean} True if the strategy was successfully deactivated or false if
     *      the strategy was already inactive.
     */
    deactivate: function() {
        if (this.active) {
            this.active = false;
            return true;
        }
        return false;
    },
   
    CLASS_NAME: "OpenLayers.Strategy" 
});
