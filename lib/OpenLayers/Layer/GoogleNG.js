/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/XYZ.js
 * @requires OpenLayers/Tile/Google.js
 * @requires OpenLayers/Layer/SphericalMercator.js
 */

/** 
 * Class: OpenLayers.Layer.GoogleNG
 * Google layer using <OpenLayers.Tile.Google> tiles.
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
     * Property: serverResolutions
     * {Array} the resolutions provided by the Google API.
     */
    serverResolutions: [
        156543.03390625, 78271.516953125, 39135.7584765625,
        19567.87923828125, 9783.939619140625, 4891.9698095703125,
        2445.9849047851562, 1222.9924523925781, 611.4962261962891,
        305.74811309814453, 152.87405654907226, 76.43702827453613,
        38.218514137268066, 19.109257068634033, 9.554628534317017,
        4.777314267158508, 2.388657133579254, 1.194328566789627,
        0.5971642833948135, 0.29858214169740677, 0.14929107084870338,
        0.07464553542435169, 0.037322767712175846
    ],
    
    /**
     * Property: attributionTemplate
     * {String}
     */
    attributionTemplate: '<span class="olGoogleAttribution ${mapType}">' +
         '<div><a title="Click to see this area on Google Maps" ' + 
         'target="_blank" href="http://maps.google.com/maps?' +
         'll=${center}&z=${zoom}&t=${t}"><img width="62" height="24" ' +
         'src="http://maps.gstatic.com/mapfiles/google_white.png"/></a>' +
         '</div>${mapData}<a style="white-space: nowrap" target="_blank" ' +
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
     * APIProperty: type
     * {google.maps.MapTypeId} See
     * http://code.google.com/apis/maps/documentation/javascript/reference.html#MapTypeId
     */
    type: null,
    
    /**
     * Constructor: OpenLayers.Layer.GoogleNG
     * Create a new GoogleNG layer. Requires the GMaps v3 JavaScript API script
     * (http://maps.google.com/maps/api/js?v=3.5&amp;sensor=false) loaded in
     * the html document. Note: Terms of Service compliant use requires the map
     * to be configured with an <OpenLayers.Control.Attribution> control and
     * the attribution placed on the map.
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
        
        if (!OpenLayers.Layer.GoogleNG.mapObject) {
            OpenLayers.Layer.GoogleNG.mapObject =
                new google.maps.Map(document.createElement("div"));
        }
        if (OpenLayers.Layer.GoogleNG.mapObject.mapTypes[this.type]) {
            this.initLayer();
        } else {
            google.maps.event.addListenerOnce(
                OpenLayers.Layer.GoogleNG.mapObject, 
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
        var mapType = OpenLayers.Layer.GoogleNG.mapObject.mapTypes[this.type];
        if (!this.name) {
            this.setName("Google " + mapType.name);
        }
        
        var minZoom = mapType.minZoom || 0;
        this.addOptions({
            maxResolution: Math.min(
                this.serverResolutions[minZoom], this.maxResolution
            ),
            zoomOffset: minZoom,
            numZoomLevels: Math.min(
                mapType.maxZoom + 1 - minZoom, this.numZoomLevels
            )
        }, true);
    },

    /**
     * Method: addTile
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
     *
     * Parameters:
     * copyrights - {Object} Object with "m", "k", "h" and "p" properties (see
     *     <mapTypes>), each holding an array of copyrights.
     */
    updateAttribution: function(copyrights) {
        var myCopyrights;
        if (this.type == google.maps.MapTypeId.HYBRID) {
            // the Copyright Service returns "k" and "m" copyrights for the
            // HYBRID layer type.
            var candidates = [].concat(
                copyrights["h"], copyrights["k"], copyrights["m"]
            );
            myCopyrights = [];
            for (var i=candidates.length-1; i>=0; --i) {
                if (OpenLayers.Util.indexOf(candidates, myCopyrights) == -1) {
                    myCopyrights.push(candidates[i]);
                }
            }
        } else {
            myCopyrights = copyrights[this.mapTypes[this.type]];
        }
        var mapData = myCopyrights.length == 0 ? "" :
            "Map Data &copy;" + new Date().getFullYear() + " " +
            myCopyrights.join(", ") + " - ";
        var center = this.map.getCenter();
        center && center.transform(
            this.map.getProjectionObject(),
            new OpenLayers.Projection("EPSG:4326")
        );
        var size = this.map.getSize();
        this.attribution = OpenLayers.String.format(this.attributionTemplate, {
            t: this.mapTypes[this.type],
            zoom: this.map.getZoom(),
            center: center.lat + "," + center.lon,
            mapType: this.type,
            mapData: mapData
        });
        this.map && this.map.events.triggerEvent("changelayer", {
            layer: this,
            property: "attribution"
        });
    },
    
    /**
     * Method: setMap
     */
    setMap: function() {
        OpenLayers.Layer.XYZ.prototype.setMap.apply(this, arguments);
        this.events.register("moveend", this,
            OpenLayers.Layer.GoogleNG.loadCopyrights
        );
    },
    
    /**
     * Method: removeMap
     */
    removeMap: function() {
        OpenLayers.Layer.XYZ.prototype.removeMap.apply(this, arguments);
        this.events.unregister("moveend", this,
            OpenLayers.Layer.GoogleNG.loadCopyrights
        );
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
    
    CLASS_NAME: "OpenLayers.Layer.GoogleNG"
});

/**
 * Property: mapObject
 * {google.maps.Map} Shared GMaps instance - will be set upon instantiation of
 * the 1st GoogleNG layer
 */
OpenLayers.Layer.GoogleNG.mapObject = null;

/**
 * Function: loadCopyrights
 * Using the Google Maps Copyright Service mode (see
 * http://mapki.com/wiki/Google_Map_Parameters#Misc) to get the attribution for
 * the current map extent. Will be called by each GoogleNG layer instance on
 * moveend. 
 */
OpenLayers.Layer.GoogleNG.loadCopyrights = function() {
    var me = OpenLayers.Layer.GoogleNG.loadCopyrights;
    if (me.numLoadingScripts == undefined) {
        me.loadingScripts = [];
        me.numLoadingScripts = 0;
        me.copyrights = {"m": [], "k": [], "h": [], "p": []};
        
        // store window scope functions before overwriting them
        me.origGAddCopyright = window.GAddCopyright;
        me.origGVerify = window.GVerify;
        me.origGAppFeatures = window.GAppFeatures;
        
        // defining window scope functions called by the script that the
        // Copyright Service returns
        window.GAddCopyright = function() {
            var copyright = arguments[7];
            var category = me.copyrights[arguments[0]];
            if (OpenLayers.Util.indexOf(category, copyright) == -1) {
                copyright && category.push(copyright);
            }
        };
        window.GVerify = OpenLayers.Function.True;
        window.GAppFeatures = OpenLayers.Function.bind(function() {
            me.numLoadingScripts--;
            if (me.numLoadingScripts == 0) {
                var script;
                for (var i=me.loadingScripts.length-1; i>=0; --i) {
                    script = me.loadingScripts[i][0];
                    me.loadingScripts[i][1].updateAttribution(me.copyrights);
                    script.parentNode.removeChild(script);
                }
                
                // restore original functions
                window.GAddCopyright = me.origGAddCopyright;
                delete me.origGAddCopyright;
                window.GVerify = me.origGVerify;
                delete me.origGVerify;
                window.GAppFeatures = me.origGAppFeatures;
                delete me.origGAppFeatures;
                
                delete me.loadingScripts;
                delete me.numLoadingScripts;
                delete me.copyrights;
            }
        }, this);
    }
    var mapProj = this.map.getProjectionObject();
    var llProj = new OpenLayers.Projection("EPSG:4326");
    var center = this.map.getCenter().transform(mapProj, llProj);
    var extent = this.map.getExtent().transform(mapProj, llProj);
    var params = {
        spn: extent.getHeight() + "," + extent.getWidth(),
        z: this.map.getZoom(),
        t: this.mapTypes[this.type],
        vp: center.lat + "," + center.lon
    };
    var url = "http://maps.google.com/maps?" +
        OpenLayers.Util.getParameterString(params);
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    me.numLoadingScripts++;
    me.loadingScripts.push([script, this]);
    document.getElementsByTagName("head")[0].appendChild(script);
};

