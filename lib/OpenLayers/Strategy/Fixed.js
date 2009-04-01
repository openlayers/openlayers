/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: OpenLayers.Strategy.Fixed
 * A simple strategy that requests features once and never requests new data.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.Fixed = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * APIProperty: preload
     * {Boolean} Load data before layer made visible. Enabling this may result
     *   in considerable overhead if your application loads many data layers
     *   that are not visible by default. Default is true.
     */
    preload: false,

    /**
     * Constructor: OpenLayers.Strategy.Fixed
     * Create a new Fixed strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Strategy.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: destroy
     * Clean up the strategy.
     */
    destroy: function() {
        OpenLayers.Strategy.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: activate
     * Activate the strategy: load data or add listener to load when visible
     *
     * Returns:
     * {Boolean} True if the strategy was successfully activated or false if
     *      the strategy was already active.
     */
    activate: function() {
        if(OpenLayers.Strategy.prototype.activate.apply(this, arguments)) {
            this.layer.events.on({
                "refresh": this.load,
                scope: this
            });
            if(this.layer.visibility == true || this.preload) {
                this.load();
            } else {
                this.layer.events.on({
                    "visibilitychanged": this.load,
                    scope: this
                });
            }
            return true;
        }
        return false;
    },
    
    /**
     * Method: deactivate
     * Deactivate the strategy.  Undo what is done in <activate>.
     * 
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if(deactivated) {
            this.layer.events.un({
                "refresh": this.load,
                "visibilitychanged": this.load,
                scope: this
            });
        }
        return deactivated;
    },

    /**
     * Method: load
     * Tells protocol to load data and unhooks the visibilitychanged event
     *
     * Parameters:
     * options - {Object} options to pass to protocol read.
     */
    load: function(options) {
        this.layer.events.triggerEvent("loadstart");
        this.layer.protocol.read(OpenLayers.Util.applyDefaults({
            callback: this.merge,
            scope: this
        }, options));
        this.layer.events.un({
            "visibilitychanged": this.load,
            scope: this
        });
    },

    /**
     * Method: merge
     * Add all features to the layer.
     */
    merge: function(resp) {
        this.layer.destroyFeatures();
        var features = resp.features;
        if (features && features.length > 0) {
            var remote = this.layer.projection;
            var local = this.layer.map.getProjectionObject();
            if(!local.equals(remote)) {
                var geom;
                for(var i=0, len=features.length; i<len; ++i) {
                    geom = features[i].geometry;
                    if(geom) {
                        geom.transform(remote, local);
                    }
                }
            }
            this.layer.addFeatures(features);
        }
        this.layer.events.triggerEvent("loadend");
    },

    CLASS_NAME: "OpenLayers.Strategy.Fixed"
});
