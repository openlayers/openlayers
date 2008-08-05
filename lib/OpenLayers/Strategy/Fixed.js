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
     * Activate the strategy: reads all features from the protocol and add them 
     * to the layer.
     *
     * Returns:
     * {Boolean} True if the strategy was successfully activated or false if
     *      the strategy was already active.
     */
    activate: function() {
        if(OpenLayers.Strategy.prototype.activate.apply(this, arguments)) {
            this.layer.protocol.read({
                callback: this.merge,
                scope: this
            });
            return true;
        }
        return false;
    },

    /**
     * Method: merge
     * Add all features to the layer.
     */
    merge: function(resp) {
        var features = resp.features;
        if (features && features.length > 0) {
            this.layer.addFeatures(features);
        }
    },

    CLASS_NAME: "OpenLayers.Strategy.Fixed"
});
