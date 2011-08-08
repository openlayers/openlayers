/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the Clear BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Geometry/Point.js
 * @requires OpenLayers/Projection.js
 */

/**
 * Class: OpenLayers.Control.Geolocate
 * The Geolocate control wraps w3c geolocation API into control that can be
 * bound to a map, and generate events on location update
 *
 * To use this control requires to load the proj4js library if the projection
 * of the map is not EPSG:4326 or EPSG:900913.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Geolocate = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Constant: EVENT_TYPES
     * Supported event types:
     *  - *locationupdated* Triggered when browser return a new position
     *  - *locationfailed* Triggered when geolocation has failed
     *  - *locationuncapable* Triggered when control is activated on a browser
     *  which doesn't support geolocation
     */
    EVENT_TYPES: ["locationupdated", "locationfailed", "locationuncapable"],

    /**
     * Property: geolocation
     * {Object} The geolocation engine, as a property to be possibly mocked.
     */
    geolocation: navigator.geolocation,

    /**
     * APIProperty: bind
     * {Boolean} If true, map center will be set on location update.
     */
    bind: true,

    /**
     * APIProperty: watch
     * {Boolean} If true, position will be update regularly.
     */
    watch: false,

    /**
     * APIProperty: geolocationOptions
     * {Object} Options to pass to the navigator's geolocation API. See
     *     <http://dev.w3.org/geo/api/spec-source.html>. No specific
     *     option is passed to the geolocation API by default.
     */
    geolocationOptions: null,

    /**
     * Constructor: OpenLayers.Control.Geolocate
     * Create a new control to deal with browser geolocation API
     *
     */
    initialize: function(options) {
        // concatenate events specific to this control with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.Geolocate.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );
        this.geolocationOptions = {};
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
     * Method: destroy
     */
    destroy: function() {
        this.deactivate();
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: activate
     * Activates the control.
     *
     * Returns:
     * {Boolean} The control was effectively activated.
     */
    activate: function () {
        if (!this.geolocation) {
            this.events.triggerEvent("locationuncapable");
            return false;
        }
        if (OpenLayers.Control.prototype.activate.apply(this, arguments)) {
            if (this.watch) {
                this.watchId = this.geolocation.watchPosition(
                    OpenLayers.Function.bind(this.geolocate, this),
                    OpenLayers.Function.bind(this.failure, this),
                    this.geolocationOptions
                );
            } else {
                this.getCurrentLocation();
            }
            return true;
        }
        return false;
    },

    /**
     * Method: deactivate
     * Deactivates the control.
     *
     * Returns:
     * {Boolean} The control was effectively deactivated.
     */
    deactivate: function () {
        if (this.active && this.watchId !== null) {
            this.geolocation.clearWatch(this.watchId);
        }
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },

    /**
     * Method: geolocate
     * Activates the control.
     *
     */
    geolocate: function (position) {
        var center = new OpenLayers.LonLat(
            position.coords.longitude,
            position.coords.latitude
        ).transform(
            new OpenLayers.Projection("EPSG:4326"),
            this.map.getProjectionObject()
        );
        if (this.bind) {
            this.map.setCenter(center);
        }
        this.events.triggerEvent("locationupdated", {
            position: position,
            point: new OpenLayers.Geometry.Point(
                center.lon, center.lat
            )
        });
    },

    /**
     * APIMethod: getCurrentLocation
     *
     * Returns:
     * {Boolean} Returns true if a event will be fired (successfull
     * registration)
     */
    getCurrentLocation: function() {
        if (!this.active || this.watch) {
            return false;
        }
        this.geolocation.getCurrentPosition(
            OpenLayers.Function.bind(this.geolocate, this),
            OpenLayers.Function.bind(this.failure, this),
            this.geolocationOptions
        );
        return true;
    },

    /**
     * Method: failure
     * method called on browser's geolocation failure
     *
     */
    failure: function (error) {
        this.events.triggerEvent("locationfailed", {error: error});
    },

    CLASS_NAME: "OpenLayers.Control.Geolocate"
});
