/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/XYZ.js
 */

/** 
 * Class: OpenLayers.Layer.Bing
 * Bing layer using direct tile access as provided by Bing Maps REST Services.
 * See http://msdn.microsoft.com/en-us/library/ff701713.aspx for more
 * information.
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.XYZ>
 */
OpenLayers.Layer.Bing = OpenLayers.Class(OpenLayers.Layer.XYZ, {

    /**
     * Constant: RESOLUTIONS
     */
    RESOLUTIONS: [
        78271.517,
        39135.7585,
        19567.87925,
        9783.939625,
        4891.9698125,
        2445.98490625,
        1222.992453125,
        611.4962265625,
        305.74811328125,
        152.874056640625,
        76.4370283203125,
        38.21851416015625,
        19.109257080078127,
        9.554628540039063,
        4.777314270019532,
        2.388657135009766,
        1.194328567504883,
        0.5971642837524415,
        0.29858214187622073,
        0.14929107093811037,
        0.07464553546905518,
        0.03732276773452759,
        0.018661383867263796
    ],

    /**
     * Property: attributionTemplate
     * {String}
     */
    attributionTemplate: '<span class="olBingAttribution ${type}">' +
         '<div><a target="_blank" href="http://www.bing.com/maps/">' +
         '<img src="${logo}"></img></div></a>${copyrights}' +
         '<a style="white-space: nowrap" target="_blank" '+
         'href="http://www.microsoft.com/maps/product/terms.html">' +
         'Terms of Use</a></span>',

    /**
     * Property: sphericalMercator
     * {Boolean} always true for this layer type
     */
    sphericalMercator: true,
    
    /**
     * Property: metadata
     * {Object} Metadata for this layer, as returned by the callback script
     */
    metadata: null,
    
    /**
     * APIProperty: type
     * {String} The layer identifier.  Any non-birdseye imageryType
     *     from http://msdn.microsoft.com/en-us/library/ff701716.aspx can be
     *     used.  Default is "Road".
     */
    type: "Road",

    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * layer.events.register(type, obj, listener);
     * (end)
     *
     * Listeners will be called with a reference to an event object.  The
     *     properties of this event depends on exactly what happened.
     *
     * All event objects have at least the following properties:
     * object - {Object} A reference to layer.events.object.
     * element - {DOMElement} A reference to layer.events.element.
     *
     * Supported map event types (in addition to those from <OpenLayers.Layer>):
     * added - Triggered after the layer is added to a map.  Listeners
     *      will receive an object with a *map* property referencing the
     *      map and a *layer* property referencing the layer.
     */
    EVENT_TYPES: ["added"],

    /**
     * Constructor: OpenLayers.Layer.Bing
     * Create a new Bing layer.
     *
     * Example:
     * (code)
     * var road = new OpenLayers.Layer.Bing({
     *     name: "My Bing Aerial Layer",
     *     type: "Aerial",
     *     key: "my-api-key-here",
     * });
     * (end)
     *
     * Parameters:
     * config - {Object} Configuration properties for the layer.
     *
     * Required configuration properties:
     * key - {String} Bing Maps API key for your application. Get one at
     *     http://bingmapsportal.com/.
     * type - {String} The layer identifier.  Any non-birdseye imageryType
     *     from http://msdn.microsoft.com/en-us/library/ff701716.aspx can be
     *     used.
     *
     * Any other documented layer properties can be provided in the config object.
     */
    initialize: function(options) {
        // concatenate events specific to vector with those from the base
        this.EVENT_TYPES =
            OpenLayers.Layer.Bing.prototype.EVENT_TYPES.concat(
            OpenLayers.Layer.prototype.EVENT_TYPES
        );
        var name = options.name || "Bing " + (options.type || this.type);
        var newArgs = [name, null, options];
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, newArgs);
        this.loadMetadata(this.type); 
    },

    /**
     * Method: loadMetadata
     *
     * Parameters:
     * imageryType - {String}
     */
    loadMetadata: function(imageryType) {
        this._callbackId = "_callback_" + this.id.replace(/\./g, "_");
        // link the processMetadata method to the global scope and bind it
        // to this instance
        window[this._callbackId] = OpenLayers.Function.bind(
            OpenLayers.Layer.Bing.processMetadata, this
        );
        var url = "http://dev.virtualearth.net/REST/v1/Imagery/Metadata/" +
            imageryType + "?key=" + this.key + "&jsonp=" + this._callbackId +
            "&include=ImageryProviders";
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        script.id = this._callbackId;
        document.getElementsByTagName("head")[0].appendChild(script);
    },
    
    /**
     * Method: initLayer
     *
     * Sets layer properties according to the metadata provided by the API
     */
    initLayer: function() {
        var res = this.metadata.resourceSets[0].resources[0];
        var url = res.imageUrl.replace("{quadkey}", "${quadkey}");
        this.url = [];
        for (var i=0; i<res.imageUrlSubdomains.length; ++i) {
            this.url.push(url.replace("{subdomain}", res.imageUrlSubdomains[i]));
        };
        
        this.addOptions({
            resolutions: this.RESOLUTIONS.slice(res.zoomMin-1, res.zoomMax-1),
            zoomOffset: res.zoomMin
        });
        if (this.map) {
            this.redraw();
            this.updateAttribution();
        }
    },

    /**
     * Method: getURL
     *
     * Paramters:
     * bounds - {<OpenLayers.Bounds>}
     */
    getURL: function(bounds) {
        if (!this.url) {
            return OpenLayers.Util.getImagesLocation() + "blank.gif";
        }
        var xyz = this.getXYZ(bounds), x = xyz.x, y = xyz.y, z = xyz.z;
        var quadDigits = [];
        for (var i = z; i > 0; --i) {
            var digit = '0';
            var mask = 1 << (i - 1);
            if ((x & mask) != 0) {
                digit++;
            }
            if ((y & mask) != 0) {
                digit++;
                digit++;
            }
            quadDigits.push(digit);
        }
        var quadKey = quadDigits.join("");
        var url = this.selectUrl('' + x + y + z, this.url);

        return OpenLayers.String.format(url, {'quadkey': quadKey});
    },
    
    /**
     * Method: updateAttribution
     * Updates the attribution according to the requirements outlined in
     * http://gis.638310.n2.nabble.com/Bing-imagery-td5789168.html
     */
    updateAttribution: function() {
        var metadata = this.metadata;
        if (!metadata || !this.map) {
            return;
        }
        var res = metadata.resourceSets[0].resources[0];
        var extent = this.map.getExtent().transform(
            this.map.getProjectionObject(),
            new OpenLayers.Projection("EPSG:4326")
        );
        var providers = res.imageryProviders, zoom = this.map.getZoom() + 1,
            copyrights = "", provider, i, ii, j, jj, bbox, coverage;
        for (i=0,ii=providers.length; i<ii; ++i) {
            provider = providers[i];
            for (j=0,jj=provider.coverageAreas.length; j<jj; ++j) {
                coverage = provider.coverageAreas[j];
                bbox = OpenLayers.Bounds.fromArray(coverage.bbox);
                if (extent.intersectsBounds(bbox) &&
                        zoom <= coverage.zoomMax && zoom >= coverage.zoomMin) {
                    copyrights += provider.attribution + " ";
                }
            }
        }
        this.attribution = OpenLayers.String.format(this.attributionTemplate, {
            type: this.type.toLowerCase(),
            logo: metadata.brandLogoUri,
            copyrights: copyrights
        });
        this.map && this.map.events.triggerEvent("changelayer", {layer: this});
    },
    
    /**
     * Method: setMap
     */
    setMap: function() {
        OpenLayers.Layer.XYZ.prototype.setMap.apply(this, arguments);
        if (this.map.getCenter()) {
            this.updateAttribution();
        }
        this.map.events.register("moveend", this, this.updateAttribution);
        // TODO: move this event to Layer
        // http://trac.osgeo.org/openlayers/ticket/2983
        this.events.triggerEvent("added", {map: this.map, layer: this});
    },
    
    /**
     * APIMethod: clone
     * 
     * Parameters:
     * obj - {Object}
     * 
     * Returns:
     * {<OpenLayers.Layer.Bing>} An exact clone of this <OpenLayers.Layer.Bing>
     */
    clone: function(obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.Bing(this.options);
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
    
    CLASS_NAME: "OpenLayers.Layer.Bing"
});

/**
 * Function: OpenLayers.Layer.Bing.processMetadata
 * This function will be bound to an instance, linked to the global scope with
 * an id, and called by the JSONP script returned by the API.
 *
 * Parameters:
 * metadata - {Object} metadata as returned by the API
 */
OpenLayers.Layer.Bing.processMetadata = function(metadata) {
    this.metadata = metadata;
    this.initLayer();
    var script = document.getElementById(this._callbackId);
    script.parentNode.removeChild(script);
    window[this._callbackId] = undefined; // cannot delete from window in IE
    delete this._callbackId;
};
