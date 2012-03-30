/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 * @requires OpenLayers/Filter.js
 */

/**
 * Class: OpenLayers.Strategy.Filter
 * Strategy for limiting features that get added to a layer by 
 *     evaluating a filter.  The strategy maintains a cache of
 *     all features until removeFeatures is called on the layer.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.Filter = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * APIProperty: filter
     * {<OpenLayers.Filter>}  Filter for limiting features sent to the layer.
     *     Use the <setFilter> method to update this filter after construction.
     */
    filter: null,
    
    /**
     * Property: cache
     * {Array(<OpenLayers.Feature.Vector>)} List of currently cached
     *     features.
     */
    cache: null,
    
    /**
     * Property: caching
     * {Boolean} The filter is currently caching features.
     */
    caching: false,
    
    /**
     * Constructor: OpenLayers.Strategy.Filter
     * Create a new filter strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */

    /**
     * APIMethod: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     *     By default, this strategy automatically activates itself when a layer
     *     is added to a map.
     *
     * Returns:
     * {Boolean} True if the strategy was successfully activated or false if
     *      the strategy was already active.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.apply(this, arguments);
        if (activated) {
            this.cache = [];
            this.layer.events.on({
                "beforefeaturesadded": this.handleAdd,
                "beforefeaturesremoved": this.handleRemove,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the strategy.  Clear the feature cache.
     *
     * Returns:
     * {Boolean} True if the strategy was successfully deactivated or false if
     *      the strategy was already inactive.
     */
    deactivate: function() {
        this.cache = null;
        if (this.layer && this.layer.events) {
            this.layer.events.un({
                "beforefeaturesadded": this.handleAdd,
                "beforefeaturesremoved": this.handleRemove,
                scope: this
            });            
        }
        return OpenLayers.Strategy.prototype.deactivate.apply(this, arguments);
    },
    
    /**
     * Method: handleAdd
     */
    handleAdd: function(event) {
        if (!this.caching && this.filter) {
            var features = event.features;
            event.features = [];
            var feature;
            for (var i=0, ii=features.length; i<ii; ++i) {
                feature = features[i];
                if (this.filter.evaluate(feature)) {
                    event.features.push(feature);
                } else {
                    this.cache.push(feature);
                }
            }
        }
    },
    
    /**
     * Method: handleRemove
     */
    handleRemove: function(event) {
        if (!this.caching) {
            this.cache = [];
        }
    },

    /** 
     * APIMethod: setFilter
     * Update the filter for this strategy.  This will re-evaluate
     *     any features on the layer and in the cache.  Only features
     *     for which filter.evalute(feature) returns true will be
     *     added to the layer.  Others will be cached by the strategy.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>} A filter for evaluating features.
     */
    setFilter: function(filter) {
        this.filter = filter;
        var previousCache = this.cache;
        this.cache = [];
        // look through layer for features to remove from layer
        this.handleAdd({features: this.layer.features});
        // cache now contains features to remove from layer
        if (this.cache.length > 0) {
            this.caching = true;
            this.layer.removeFeatures(this.cache.slice());
            this.caching = false;
        }
        // now look through previous cache for features to add to layer
        if (previousCache.length > 0) {
            var event = {features: previousCache};
            this.handleAdd(event);
            if (event.features.length > 0) {
                // event has features to add to layer
                this.caching = true;
                this.layer.addFeatures(event.features);
                this.caching = false;
            }
        }
    },

    CLASS_NAME: "OpenLayers.Strategy.Filter"

});
