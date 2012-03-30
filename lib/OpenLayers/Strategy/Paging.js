/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: OpenLayers.Strategy.Paging
 * Strategy for vector feature paging
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.Paging = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * Property: features
     * {Array(<OpenLayers.Feature.Vector>)} Cached features.
     */
    features: null,
    
    /**
     * Property: length
     * {Integer} Number of features per page.  Default is 10.
     */
    length: 10,
    
    /**
     * Property: num
     * {Integer} The currently displayed page number.
     */
    num: null,
    
    /**
     * Property: paging
     * {Boolean} The strategy is currently changing pages.
     */
    paging: false,

    /**
     * Constructor: OpenLayers.Strategy.Paging
     * Create a new paging strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    
    /**
     * APIMethod: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     * 
     * Returns:
     * {Boolean} The strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.call(this);
        if(activated) {
            this.layer.events.on({
                "beforefeaturesadded": this.cacheFeatures,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     * 
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if(deactivated) {
            this.clearCache();
            this.layer.events.un({
                "beforefeaturesadded": this.cacheFeatures,
                scope: this
            });
        }
        return deactivated;
    },
    
    /**
     * Method: cacheFeatures
     * Cache features before they are added to the layer.
     *
     * Parameters:
     * event - {Object} The event that this was listening for.  This will come
     *     with a batch of features to be paged.
     */
    cacheFeatures: function(event) {
        if(!this.paging) {
            this.clearCache();
            this.features = event.features;
            this.pageNext(event);
        }
    },
    
    /**
     * Method: clearCache
     * Clear out the cached features.  This destroys features, assuming
     *     nothing else has a reference.
     */
    clearCache: function() {
        if(this.features) {
            for(var i=0; i<this.features.length; ++i) {
                this.features[i].destroy();
            }
        }
        this.features = null;
        this.num = null;
    },
    
    /**
     * APIMethod: pageCount
     * Get the total count of pages given the current cache of features.
     *
     * Returns:
     * {Integer} The page count.
     */
    pageCount: function() {
        var numFeatures = this.features ? this.features.length : 0;
        return Math.ceil(numFeatures / this.length);
    },

    /**
     * APIMethod: pageNum
     * Get the zero based page number.
     *
     * Returns:
     * {Integer} The current page number being displayed.
     */
    pageNum: function() {
        return this.num;
    },

    /**
     * APIMethod: pageLength
     * Gets or sets page length.
     *
     * Parameters:
     * newLength - {Integer} Optional length to be set.
     *
     * Returns:
     * {Integer} The length of a page (number of features per page).
     */
    pageLength: function(newLength) {
        if(newLength && newLength > 0) {
            this.length = newLength;
        }
        return this.length;
    },

    /**
     * APIMethod: pageNext
     * Display the next page of features.
     *
     * Returns:
     * {Boolean} A new page was displayed.
     */
    pageNext: function(event) {
        var changed = false;
        if(this.features) {
            if(this.num === null) {
                this.num = -1;
            }
            var start = (this.num + 1) * this.length;
            changed = this.page(start, event);
        }
        return changed;
    },

    /**
     * APIMethod: pagePrevious
     * Display the previous page of features.
     *
     * Returns:
     * {Boolean} A new page was displayed.
     */
    pagePrevious: function() {
        var changed = false;
        if(this.features) {
            if(this.num === null) {
                this.num = this.pageCount();
            }
            var start = (this.num - 1) * this.length;
            changed = this.page(start);
        }
        return changed;
    },
    
    /**
     * Method: page
     * Display the page starting at the given index from the cache.
     *
     * Returns:
     * {Boolean} A new page was displayed.
     */
    page: function(start, event) {
        var changed = false;
        if(this.features) {
            if(start >= 0 && start < this.features.length) {
                var num = Math.floor(start / this.length);
                if(num != this.num) {
                    this.paging = true;
                    var features = this.features.slice(start, start + this.length);
                    this.layer.removeFeatures(this.layer.features);
                    this.num = num;
                    // modify the event if any
                    if(event && event.features) {
                        // this.was called by an event listener
                        event.features = features;
                    } else {
                        // this was called directly on the strategy
                        this.layer.addFeatures(features);
                    }
                    this.paging = false;
                    changed = true;
                }
            }
        }
        return changed;
    },
    
    CLASS_NAME: "OpenLayers.Strategy.Paging" 
});
