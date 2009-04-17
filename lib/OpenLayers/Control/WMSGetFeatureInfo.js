/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Click.js
 * @requires OpenLayers/Handler/Hover.js
 * @requires OpenLayers/Request.js
 */

/**
 * Class: OpenLayers.Control.WMSGetFeatureInfo
 * The WMSGetFeatureInfo control uses a WMS query to get information about a point on the map.  The
 * information may be in a display-friendly format such as HTML, or a machine-friendly format such 
 * as GML, depending on the server's capabilities and the client's configuration.  This control 
 * handles click or hover events, attempts to parse the results using an OpenLayers.Format, and 
 * fires a 'getfeatureinfo' event with the click position, the raw body of the response, and an 
 * array of features if it successfully read the response.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.WMSGetFeatureInfo = OpenLayers.Class(OpenLayers.Control, {
    
   /**
     * APIProperty: hover
     * {Boolean} Send GetFeatureInfo requests when mouse stops moving.
     *     Default is false.
     */
    hover: false,

    /**
     * APIProperty: maxFeatures
     * {Integer} Maximum number of features to return from a WMS query. This
     *     sets the feature_count parameter on WMS GetFeatureInfo
     *     requests.
     */
    maxFeatures: 10,
    
    /**
     * Property: layers
     * {Array(<OpenLayers.Layer.WMS>)} The layers to query for feature info.
     *     If omitted, all map WMS layers with a url that matches this <url> or
     *     <layerUrl> will be considered.
     */
    layers: null,

    /**
     * Property: queryVisible
     * {Boolean} If true, filter out hidden layers when searching the map for
     *     layers to query.  Default is false.
     */
    queryVisible: false,

    /**
     * Property: url
     * {String} The URL of the WMS service to use.  If not provided, the url
     *     of the first eligible layer will be used.
     */
    url: null,
    
    /**
     * Property: layerUrls
     * {Array(String)} Optional list of urls for layers that should be queried.
     *     This can be used when the layer url differs from the url used for
     *     making GetFeatureInfo requests (in the case of a layer using cached
     *     tiles).
     */
    layerUrls: null,

    /**
     * Property: infoFormat
     * {String} The mimetype to request from the server
     */
    infoFormat: 'text/html',
    
    /**
     * Property: vendorParams
     * {Object} Additional parameters that will be added to the request, for
     * WMS implementations that support them. This could e.g. look like
     * (start code)
     * {
     *     radius: 5
     * }
     * (end)
     */
    vendorParams: {},
    
    /**
     * Property: format
     * {<OpenLayers.Format>} A format for parsing GetFeatureInfo responses.
     *     Default is <OpenLayers.Format.WMSGetFeatureInfo>.
     */
    format: null,
    
    /**
     * Property: formatOptions
     * {Object} Optional properties to set on the format (if one is not provided
     *     in the <format> property.
     */
    formatOptions: null,

    /**
     * APIProperty: handlerOptions
     * {Object} Additional options for the handlers used by this control, e.g.
     * (start code)
     * {
     *     "click": {delay: 100},
     *     "hover": {delay: 300}
     * }
     * (end)
     */
    handlerOptions: null,
    
    /**
     * Property: handler
     * {Object} Reference to the <OpenLayers.Handler> for this control
     */
    handler: null,
    
    /**
     * Property: hoverRequest
     * {<OpenLayers.Request>} contains the currently running hover request
     *     (if any).
     */
    hoverRequest: null,
    
    /**
     * Constant: EVENT_TYPES
     *
     * Supported event types (in addition to those from <OpenLayers.Control>):
     * getfeatureinfo - Triggered when a GetFeatureInfo response is received.
     *      The event object has a *text* property with the body of the
     *      response (String), a *features* property with an array of the
     *      parsed features, an *xy* property with the position of the mouse
     *      click or hover event that triggered the request, and a *request*
     *      property with the request itself.
     */
    EVENT_TYPES: ["getfeatureinfo"],

    /**
     * Constructor: <OpenLayers.Control.WMSGetFeatureInfo>
     *
     * Parameters:
     * options - {Object} 
     */
    initialize: function(options) {
        // concatenate events specific to vector with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.WMSGetFeatureInfo.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );

        options = options || {};
        options.handlerOptions = options.handlerOptions || {};

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        if(!this.format) {
            this.format = new OpenLayers.Format.WMSGetFeatureInfo(
                options.formatOptions
            );
        }

        if (this.hover) {
            this.handler = new OpenLayers.Handler.Hover(
                   this, {
                       'move': this.cancelHover,
                       'pause': this.getInfoForHover
                   },
                   OpenLayers.Util.extend(this.handlerOptions.hover || {}, {
                       'delay': 250
                   }));
        } else {
            this.handler = new OpenLayers.Handler.Click(this,
                {click: this.getInfoForClick}, this.handlerOptions.click || {});
        }
    },

    /**
     * Method: activate
     * Activates the control.
     * 
     * Returns:
     * {Boolean} The control was effectively activated.
     */
    activate: function () {
        if (!this.active) {
            this.handler.activate();
        }
        return OpenLayers.Control.prototype.activate.apply(
            this, arguments
        );
    },

    /**
     * Method: deactivate
     * Deactivates the control.
     * 
     * Returns:
     * {Boolean} The control was effectively deactivated.
     */
    deactivate: function () {
        return OpenLayers.Control.prototype.deactivate.apply(
            this, arguments
        );
    },
    
    /**
     * Method: getInfoForClick 
     * Called on click
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    getInfoForClick: function(evt) {
        // Set the cursor to "wait" to tell the user we're working on their
        // click.
        OpenLayers.Element.addClass(this.map.viewPortDiv, "olCursorWait");
        this.request(evt.xy, {});
    },
   
    /**
     * Method: getInfoForHover
     * Pause callback for the hover handler
     *
     * Parameters:
     * evt - {Object}
     */
    getInfoForHover: function(evt) {
        this.request(evt.xy, {hover: true});
    },

    /**
     * Method: cancelHover
     * Cancel callback for the hover handler
     */
    cancelHover: function() {
        if (this.hoverRequest) {
            this.hoverRequest.abort();
            this.hoverRequest = null;
        }
    },

    /**
     * Method: findLayers
     * Internal method to get the layers, independent of whether we are
     *     inspecting the map or using a client-provided array
     */
    findLayers: function() {

        var layers = [];
        
        var candidates = this.layers || this.map.layers;
        var layer, url;
        for(var i=0, len=candidates.length; i<len; ++i) {
            layer = candidates[i];
            if(layer instanceof OpenLayers.Layer.WMS &&
               (!this.queryVisible || layer.getVisibility())) {
                url = layer.url instanceof Array ? layer.url[0] : layer.url;
                // if the control was not configured with a url, set it
                // to the first layer url
                if(!this.url) {
                    this.url = url;
                }
                if(this.urlMatches(url)) {
                    layers.push(layer);
                }
            }
        }

        return layers;
    },
    
    /**
     * Method: urlMatches
     * Test to see if the provided url matches either the control <url> or one
     *     of the <layerUrls>.
     *
     * Parameters:
     * url - {String} The url to test.
     *
     * Returns:
     * {Boolean} The provided url matches the control <url> or one of the
     *     <layerUrls>.
     */
    urlMatches: function(url) {
        var matches = OpenLayers.Util.isEquivalentUrl(this.url, url);
        if(!matches && this.layerUrls) {
            for(var i=0, len=this.layerUrls.length; i<len; ++i) {
                if(OpenLayers.Util.isEquivalentUrl(this.layerUrls[i], url)) {
                    matches = true;
                    break;
                }
            }
        }
        return matches;
    },

    /**
     * Method: request
     * Sends a GetFeatureInfo request to the WMS
     * 
     * Parameters:
     * clickPosition - {<OpenLayers.Pixel>} The position on the map where the
     *     mouse event occurred.
     * options - {Object} additional options for this method.
     * 
     * Valid options:
     * - *hover* {Boolean} true if we do the request for the hover handler
     */
    request: function(clickPosition, options) {
        options = options || {};
        var layerNames = [];
        var styleNames = [];

        var layers = this.findLayers();
        if(layers.length > 0) {

            for (var i = 0, len = layers.length; i < len; i++) { 
                layerNames = layerNames.concat(layers[i].params.LAYERS);
                // in the event of a WMS layer bundling multiple layers but not
                // specifying styles,we need the same number of commas to specify
                // the default style for each of the layers.  We can't just leave it
                // blank as we may be including other layers that do specify styles.
                if (layers[i].params.STYLES) {
                    styleNames = styleNames.concat(layers[i].params.STYLES);
                } else {
                    if (layers[i].params.LAYERS instanceof Array) {
                        styleNames = styleNames.concat(new Array(layers[i].params.LAYERS.length));
                    } else { // Assume it's a String
                        styleNames = styleNames.concat(layers[i].params.LAYERS.replace(/[^,]/g, ""));
                    }
                }
            }
    
            var wmsOptions = {
                url: this.url,
                params: OpenLayers.Util.applyDefaults({
                    service: "WMS",
                    version: "1.1.0",
                    request: "GetFeatureInfo",
                    layers: layerNames,
                    query_layers: layerNames,
                    styles: styleNames,
                    bbox: this.map.getExtent().toBBOX(),
                    srs: this.map.getProjection(),
                    feature_count: this.maxFeatures,
                    x: clickPosition.x,
                    y: clickPosition.y,
                    height: this.map.getSize().h,
                    width: this.map.getSize().w,
                    info_format: this.infoFormat 
                }, this.vendorParams), 
                callback: function(request) {
                    this.handleResponse(clickPosition, request);
                },
                scope: this                    
            };
    
            var response = OpenLayers.Request.GET(wmsOptions);
    
            if (options.hover === true) {
                this.hoverRequest = response.priv;
            }
        } else {
            // Reset the cursor.
            OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
        }
    },
    
    /**
     * Method: handleResponse
     * Handler for the GetFeatureInfo response.
     * 
     * Parameters:
     * xy - {<OpenLayers.Pixel>} The position on the map where the
     *     mouse event occurred.
     * request - {XMLHttpRequest} The request object.
     */
    handleResponse: function(xy, request) {
        
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        var features = this.format.read(doc);

        this.events.triggerEvent("getfeatureinfo", {
            text: request.responseText,
            features: features,
            request: request,
            xy: xy
        });
        
        // Reset the cursor.
        OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
    },
   
    /** 
     * Method: setMap
     * Set the map property for the control. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Control.WMSGetFeatureInfo"
});
