/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
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
     *   that are not visible by default. Default is false.
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
        var layer = this.layer;
        layer.events.triggerEvent("loadstart");
        layer.protocol.read(OpenLayers.Util.applyDefaults({
            callback: OpenLayers.Function.bind(this.merge, this,
                layer.map.getProjectionObject()),
            filter: layer.filter
        }, options));
        layer.events.un({
            "visibilitychanged": this.load,
            scope: this
        });
    },

    /**
     * Method: merge
     * Add all features to the layer.
     *
     * Parameters:
     * mapProjection - {<OpenLayers.Projection>} the map projection
     * resp - {Object} options to pass to protocol read.
     */
    merge: function(mapProjection, resp) {
        var layer = this.layer;
        layer.destroyFeatures();
        var features = resp.features;
        if (features && features.length > 0) {
            if(!mapProjection.equals(layer.projection)) {
                var geom;
                for(var i=0, len=features.length; i<len; ++i) {
                    geom = features[i].geometry;
                    if(geom) {
                        geom.transform(layer.projection, mapProjection);
                    }
                }
            }
            layer.addFeatures(features);
        }
        layer.events.triggerEvent("loadend");
    },

    CLASS_NAME: "OpenLayers.Strategy.Fixed"
});
