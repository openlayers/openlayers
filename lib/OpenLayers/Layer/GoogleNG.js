/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/XYZ.js
 * @requires OpenLayers/Tile/Google.js
 */

/** 
 * Class: OpenLayers.Layer.GoogleNG
 * Google layer using <OpenLayers.Tile.Google> tiles. Note: Terms of Service
 * compliant use requires the map to be configured with an
 * <OpenLayers.Control.Attribution> control and the attribution placed on or
 * near the map.
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.XYZ>
 */
OpenLayers.Layer.GoogleNG = OpenLayers.Class(OpenLayers.Layer.XYZ, {

    /**
     * Property: SUPPORTED_TRANSITIONS
     * {Array} An immutable (that means don't change it!) list of supported 
     *     transitionEffect values. This layer type supports none.
     */
    SUPPORTED_TRANSITIONS: [],
    
    /**
     * Property: attributionTemplate
     * {String}
     */
    attributionTemplate: '<span class="olGoogleAttribution ${mapType}">' +
         '<div><a target="_blank" href="http://maps.google.com/maps?' +
         'll=${center}&z=${zoom}&t=${t}"><img width="62" height="24" ' +
         'src="http://maps.gstatic.com/mapfiles/google_white.png"/></a>' +
         '</div><a style="white-space: nowrap" target="_blank" ' +
         'href="http://maps.google.com/maps/api/staticmap?sensor=true' +
         '&center=${center}&zoom=${zoom}&size=${size}&maptype=${mapType}">' +
         'Map data</a> - <a style="white-space: nowrap" target="_blank" ' +
         'href="http://www.google.com/help/terms_maps.html">' +
         'Terms of Use</a></span>',
    
    /**
     * Property: mapTypes
     * {Object} mapping of {google.maps.MapTypeId} to the t param of
     * http://maps.google.com/maps? permalinks
     */
    mapTypes: {
        "roadmap": "m",
        "satellite": "k",
        "hybrid": "h",
        "terrain": "p"
    },
    
    /**
     * Property: mapObject
     * {google.maps.Map} Shared GMaps instance - will be set on the prototype
     * upon instantiation of the 1st GoogleNG layer
     */
    mapObject: null,

    /**
     * APIProperty: type
     * {google.maps.MapTypeId} See
     * http://code.google.com/apis/maps/documentation/javascript/reference.html#MapTypeId
     */
    type: null,
    
    /**
     * Constructor: OpenLayers.Layer.GoogleNG
     * Create a new GoogleNG layer. Requires the GMaps v3 JavaScript API script
     * included in the html document.
     *
     * Example:
     * (code)
     * var terrain = new OpenLayers.Layer.GoogleNG({
     *     name: "Google Terrain",
     *     type: google.maps.MapTypeId.TERRAIN
     * });
     * (end)
     *
     * Parameters:
     * options - {Object} Configuration properties for the layer.
     *
     * Required configuration properties:
     * type - {google.maps.MapTypeId} The layer identifier.  See
     *     http://code.google.com/apis/maps/documentation/javascript/reference.html#MapTypeId
     *     for valid types.
     *
     * Any other documented layer properties can be provided in the config object.
     */
    initialize: function(options) {
        options = OpenLayers.Util.applyDefaults({
            sphericalMercator: true
        }, options);

        if (!options.type) {
            options.type = google.maps.MapTypeId.ROADMAP;
        }
        var newArgs = [options.name, null, options];
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, newArgs);
        
        this.options.numZoomLevels = options.numZoomLevels;
        if (!this.mapObject) {
            OpenLayers.Layer.GoogleNG.prototype.mapObject =
                new google.maps.Map(document.createElement("div"));
        }
        if (this.mapObject.mapTypes[this.type]) {
            this.initLayer();
        } else {
            google.maps.event.addListenerOnce(
                this.mapObject, 
                "idle", 
                OpenLayers.Function.bind(this.initLayer, this)
            );
        }
    },

    /**
     * Method: initLayer
     *
     * Sets layer properties according to the metadata provided by the API
     */
    initLayer: function() {
        var mapType = this.mapObject.mapTypes[this.type];
        if (!this.name) {
            this.setName("Google " + mapType.name);
        }
        
        var numZoomLevels = mapType.maxZoom + 1;
        if (this.options.numZoomLevels != null) {
            numZoomLevels = Math.min(numZoomLevels, this.options.numZoomLevels);
        }
        var restrictedMinZoom;
        if (this.restrictedMinZoom || mapType.minZoom) {
            restrictedMinZoom = Math.max(
                mapType.minZoom || 0, this.restrictedMinZoom || 0
            );
        }
        
        this.addOptions({
            restrictedMinZoom: restrictedMinZoom,
            numZoomLevels: numZoomLevels,
            tileSize: new OpenLayers.Size(
                mapType.tileSize.width, mapType.tileSize.height
            )
        });
        // redraw to populate tiles with content
        this.redraw();
    },

    /**
     * APIMethod: addTile
     * Create a tile, initialize it, and add it to the layer div. 
     *
     * Parameters
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     *
     * Returns:
     * {<OpenLayers.Tile.Google>} The added OpenLayers.Tile.Google
     */
    addTile:function(bounds, position) {
        return new OpenLayers.Tile.Google(
            this, position, bounds, this.tileOptions
        );
    },
    
    /**
     * Method: updateAttribution
     * Updates the attribution using the <attributionTemplate>
     */
    updateAttribution: function() {
        var center = this.map.getCenter();
        center && center.transform(
            this.map.getProjectionObject(),
            new OpenLayers.Projection("EPSG:4326")
        );
        var size = this.map.getSize();
        this.attribution = OpenLayers.String.format(this.attributionTemplate, {
            center: center ? center.lat + "," + center.lon : "",
            zoom: this.map.getZoom(),
            size: size.w + "x" + size.h,
            t: this.mapTypes[this.type],
            mapType: this.type
        });
        this.map && this.map.events.triggerEvent("changelayer", {layer: this});
    },

    /**
     * Method: setMap
     */
    setMap: function() {
        OpenLayers.Layer.XYZ.prototype.setMap.apply(this, arguments);

        this.updateAttribution();
        this.map.events.register("moveend", this, this.updateAttribution);
    },
    
    /**
     * Method: removeMap
     */
    removeMap: function() {
        OpenLayers.Layer.XYZ.prototype.removeMap.apply(this, arguments);
        this.map.events.unregister("moveend", this, this.updateAttribution);
    },
        
    /**
     * APIMethod: clone
     * 
     * Parameters:
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.GoogleNG>} An exact clone of this
     * <OpenLayers.Layer.GoogleNG>
     */
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.GoogleNG(this.options);
        }
        //get all additions from superclasses
        obj = OpenLayers.Layer.XYZ.prototype.clone.apply(this, [obj]);
        // copy/set any non-init, non-simple values here
        return obj;
    },
    
    /**
     * Method: destroy
     */
    destroy: function() {
        this.map &&
            this.map.events.unregister("moveend", this, this.updateAttribution);
        OpenLayers.Layer.XYZ.prototype.destroy.apply(this, arguments);
    },
    
    CLASS_NAME: "OpenLayers.Layer.GoogleNG"
});