/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Click.js
 * @requires OpenLayers/Handler/Hover.js
 * @requires OpenLayers/Request.js
 * @requires OpenLayers/Format/WMSGetFeatureInfo.js
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
     * APIProperty: drillDown
     * {Boolean} Drill down over all WMS layers in the map. When
     *     using drillDown mode, hover is not possible, and an infoFormat that
     *     returns parseable features is required. Default is false.
     */
    drillDown: false,

    /**
     * APIProperty: maxFeatures
     * {Integer} Maximum number of features to return from a WMS query. This
     *     sets the feature_count parameter on WMS GetFeatureInfo
     *     requests.
     */
    maxFeatures: 10,

    /** APIProperty: clickCallback
     *  {String} The click callback to register in the
     *      {<OpenLayers.Handler.Click>} object created when the hover
     *      option is set to false. Default is "click".
     */
    clickCallback: "click",
    
    /** APIProperty: output
     *  {String} Either "features" or "object". When triggering a 
     *      getfeatureinfo request should we pass on an array of features
     *      or an object with with a "features" property and other properties
     *      (such as the url of the WMS). Default is "features".
     */
    output: "features",
    
    /**
     * Property: layers
     * {Array(<OpenLayers.Layer.WMS>)} The layers to query for feature info.
     *     If omitted, all map WMS layers with a url that matches this <url> or
     *     <layerUrls> will be considered.
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
     * {String} The mimetype to request from the server. If you are using 
     * drillDown mode and have multiple servers that do not share a common 
     * infoFormat, you can override the control's infoFormat by providing an 
     * INFO_FORMAT parameter in your <OpenLayers.Layer.WMS> instance(s).
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
     * APIProperty: events
     * {<OpenLayers.Events>} Events instance for listeners and triggering
     *     control specific events.
     *
     * Register a listener for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     * Supported event types (in addition to those from <OpenLayers.Control.events>):
     * beforegetfeatureinfo - Triggered before the request is sent.
     *      The event object has an *xy* property with the position of the 
     *      mouse click or hover event that triggers the request.
     * nogetfeatureinfo - no queryable layers were found.
     * getfeatureinfo - Triggered when a GetFeatureInfo response is received.
     *      The event object has a *text* property with the body of the
     *      response (String), a *features* property with an array of the
     *      parsed features, an *xy* property with the position of the mouse
     *      click or hover event that triggered the request, and a *request*
     *      property with the request itself. If drillDown is set to true and
     *      multiple requests were issued to collect feature info from all
     *      layers, *text* and *request* will only contain the response body
     *      and request object of the last request.
     */

    /**
     * Constructor: <OpenLayers.Control.WMSGetFeatureInfo>
     *
     * Parameters:
     * options - {Object} 
     */
    initialize: function(options) {
        options = options || {};
        options.handlerOptions = options.handlerOptions || {};

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        if(!this.format) {
            this.format = new OpenLayers.Format.WMSGetFeatureInfo(
                options.formatOptions
            );
        }
        
        if(this.drillDown === true) {
            this.hover = false;
        }

        if(this.hover) {
            this.handler = new OpenLayers.Handler.Hover(
                   this, {
                       'move': this.cancelHover,
                       'pause': this.getInfoForHover
                   },
                   OpenLayers.Util.extend(this.handlerOptions.hover || {}, {
                       'delay': 250
                   }));
        } else {
            var callbacks = {};
            callbacks[this.clickCallback] = this.getInfoForClick;
            this.handler = new OpenLayers.Handler.Click(
                this, callbacks, this.handlerOptions.click || {});
        }
    },

    /**
     * Method: getInfoForClick 
     * Called on click
     *
     * Parameters:
     * evt - {<OpenLayers.Event>} 
     */
    getInfoForClick: function(evt) {
        this.events.triggerEvent("beforegetfeatureinfo", {xy: evt.xy});
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
        this.events.triggerEvent("beforegetfeatureinfo", {xy: evt.xy});
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

        var candidates = this.layers || this.map.layers;
        var layers = [];
        var layer, url;
        for(var i = candidates.length - 1; i >= 0; --i) {
            layer = candidates[i];
            if(layer instanceof OpenLayers.Layer.WMS &&
               (!this.queryVisible || layer.getVisibility())) {
                url = OpenLayers.Util.isArray(layer.url) ? layer.url[0] : layer.url;
                // if the control was not configured with a url, set it
                // to the first layer url
                if(this.drillDown === false && !this.url) {
                    this.url = url;
                }
                if(this.drillDown === true || this.urlMatches(url)) {
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
     * Method: buildWMSOptions
     * Build an object with the relevant WMS options for the GetFeatureInfo request
     *
     * Parameters:
     * url - {String} The url to be used for sending the request
     * layers - {Array(<OpenLayers.Layer.WMS)} An array of layers
     * clickPosition - {<OpenLayers.Pixel>} The position on the map where the mouse
     *     event occurred.
     * format - {String} The format from the corresponding GetMap request
     */
    buildWMSOptions: function(url, layers, clickPosition, format) {
        var layerNames = [], styleNames = [];
        for (var i = 0, len = layers.length; i < len; i++) {
            if (layers[i].params.LAYERS != null) {
                layerNames = layerNames.concat(layers[i].params.LAYERS);
                styleNames = styleNames.concat(this.getStyleNames(layers[i]));
            }
        }
        var firstLayer = layers[0];
        // use the firstLayer's projection if it matches the map projection -
        // this assumes that all layers will be available in this projection
        var projection = this.map.getProjection();
        var layerProj = firstLayer.projection;
        if (layerProj && layerProj.equals(this.map.getProjectionObject())) {
            projection = layerProj.getCode();
        }
        var params = OpenLayers.Util.extend({
            service: "WMS",
            version: firstLayer.params.VERSION,
            request: "GetFeatureInfo",
            exceptions: firstLayer.params.EXCEPTIONS,
            bbox: this.map.getExtent().toBBOX(null,
                firstLayer.reverseAxisOrder()),
            feature_count: this.maxFeatures,
            height: this.map.getSize().h,
            width: this.map.getSize().w,
            format: format,
            info_format: firstLayer.params.INFO_FORMAT || this.infoFormat
        }, (parseFloat(firstLayer.params.VERSION) >= 1.3) ?
            {
                crs: projection,
                i: parseInt(clickPosition.x),
                j: parseInt(clickPosition.y)
            } :
            {
                srs: projection,
                x: parseInt(clickPosition.x),
                y: parseInt(clickPosition.y)
            }
        );
        if (layerNames.length != 0) {
            params = OpenLayers.Util.extend({
                layers: layerNames,
                query_layers: layerNames,
                styles: styleNames
            }, params);
        }
        OpenLayers.Util.applyDefaults(params, this.vendorParams);
        return {
            url: url,
            params: OpenLayers.Util.upperCaseObject(params),
            callback: function(request) {
                this.handleResponse(clickPosition, request, url);
            },
            scope: this
        };
    },

    /**
     * Method: getStyleNames
     * Gets the STYLES parameter for the layer. Make sure the STYLES parameter
     * matches the LAYERS parameter
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>}
     *
     * Returns:
     * {Array(String)} The STYLES parameter
     */
    getStyleNames: function(layer) {
        // in the event of a WMS layer bundling multiple layers but not
        // specifying styles,we need the same number of commas to specify
        // the default style for each of the layers.  We can't just leave it
        // blank as we may be including other layers that do specify styles.
        var styleNames;
        if (layer.params.STYLES) {
            styleNames = layer.params.STYLES;
        } else {
            if (OpenLayers.Util.isArray(layer.params.LAYERS)) {
                styleNames = new Array(layer.params.LAYERS.length);
            } else { // Assume it's a String
                styleNames = layer.params.LAYERS.replace(/[^,]/g, "");
            }
        }
        return styleNames;
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
        var layers = this.findLayers();
        if(layers.length == 0) {
            this.events.triggerEvent("nogetfeatureinfo");
            // Reset the cursor.
            OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
            return;
        }
        
        options = options || {};
        if(this.drillDown === false) {
            var wmsOptions = this.buildWMSOptions(this.url, layers,
                clickPosition, layers[0].params.FORMAT); 
            var request = OpenLayers.Request.GET(wmsOptions);
    
            if (options.hover === true) {
                this.hoverRequest = request;
            }
        } else {
            this._requestCount = 0;
            this._numRequests = 0;
            this.features = [];
            // group according to service url to combine requests
            var services = {}, url;
            for(var i=0, len=layers.length; i<len; i++) {
                var layer = layers[i];
                var service, found = false;
                url = OpenLayers.Util.isArray(layer.url) ? layer.url[0] : layer.url;
                if(url in services) {
                    services[url].push(layer);
                } else {
                    this._numRequests++;
                    services[url] = [layer];
                }
            }
            var layers;
            for (var url in services) {
                layers = services[url];
                var wmsOptions = this.buildWMSOptions(url, layers, 
                    clickPosition, layers[0].params.FORMAT);
                OpenLayers.Request.GET(wmsOptions); 
            }
        }
    },

    /**
     * Method: triggerGetFeatureInfo
     * Trigger the getfeatureinfo event when all is done
     *
     * Parameters:
     * request - {XMLHttpRequest} The request object
     * xy - {<OpenLayers.Pixel>} The position on the map where the
     *     mouse event occurred.
     * features - {Array(<OpenLayers.Feature.Vector>)} or
     *     {Array({Object}) when output is "object". The object has a url and a
     *     features property which contains an array of features.
     */
    triggerGetFeatureInfo: function(request, xy, features) {
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
     * Method: handleResponse
     * Handler for the GetFeatureInfo response.
     * 
     * Parameters:
     * xy - {<OpenLayers.Pixel>} The position on the map where the
     *     mouse event occurred.
     * request - {XMLHttpRequest} The request object.
     * url - {String} The url which was used for this request.
     */
    handleResponse: function(xy, request, url) {
        
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        var features = this.format.read(doc);
        if (this.drillDown === false) {
            this.triggerGetFeatureInfo(request, xy, features);
        } else {
            this._requestCount++;
            if (this.output === "object") {
                this._features = (this._features || []).concat(
                    {url: url, features: features}
                );
            } else {
            this._features = (this._features || []).concat(features);
            }
            if (this._requestCount === this._numRequests) {
                this.triggerGetFeatureInfo(request, xy, this._features.concat()); 
                delete this._features;
                delete this._requestCount;
                delete this._numRequests;
            }
        }
    },

    CLASS_NAME: "OpenLayers.Control.WMSGetFeatureInfo"
});
