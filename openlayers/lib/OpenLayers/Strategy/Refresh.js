/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: OpenLayers.Strategy.Refresh
 * A strategy that refreshes the layer. By default the strategy waits for a
 *     call to <refresh> before refreshing.  By configuring the strategy with 
 *     the <interval> option, refreshing can take place automatically.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.Refresh = OpenLayers.Class(OpenLayers.Strategy, {
    
    /**
     * Property: force
     * {Boolean} Force a refresh on the layer. Default is false.
     */
    force: false,

    /**
     * Property: interval
     * {Number} Auto-refresh. Default is 0.  If > 0, layer will be refreshed 
     *     every N milliseconds.
     */
    interval: 0,
    
    /**
     * Property: timer
     * {Number} The id of the timer.
     */
    timer: null,

    /**
     * Constructor: OpenLayers.Strategy.Refresh
     * Create a new Refresh strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
   
    /**
     * APIMethod: activate
     * Activate the strategy. Register any listeners, do appropriate setup.
     * 
     * Returns:
     * {Boolean} True if the strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.call(this);
        if(activated) {
            if(this.layer.visibility === true) {
                this.start();
            } 
            this.layer.events.on({
                "visibilitychanged": this.reset,
                scope: this
            });
        }
        return activated;
    },
    
    /**
     * APIMethod: deactivate
     * Deactivate the strategy. Unregister any listeners, do appropriate
     *     tear-down.
     * 
     * Returns:
     * {Boolean} True if the strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if(deactivated) {
            this.stop();
        }
        return deactivated;
    },
    
    /**
     * Method: reset
     * Start or cancel the refresh interval depending on the visibility of 
     *     the layer.
     */
    reset: function() {
        if(this.layer.visibility === true) {
            this.start();
        } else {
            this.stop();
        }
    },
    
    /**
     * Method: start
     * Start the refresh interval. 
     */
    start: function() {
        if(this.interval && typeof this.interval === "number" && 
            this.interval > 0) {

            this.timer = window.setInterval(
                OpenLayers.Function.bind(this.refresh, this),
                this.interval);
        }
    },
    
    /**
     * APIMethod: refresh
     * Tell the strategy to refresh which will refresh the layer.
     */
    refresh: function() {
        if (this.layer && this.layer.refresh && 
            typeof this.layer.refresh == "function") {

            this.layer.refresh({force: this.force});
        }
    },
   
    /**
     * Method: stop
     * Cancels the refresh interval. 
     */
    stop: function() {
        if(this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    },
    
    CLASS_NAME: "OpenLayers.Strategy.Refresh" 
});
