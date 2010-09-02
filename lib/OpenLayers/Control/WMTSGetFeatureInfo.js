/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Click.js
 * @requires OpenLayers/Handler/Hover.js
 * @requires OpenLayers/Request.js
 * @requires OpenLayers/Format/WMSGetFeatureInfo.js
 */

/**
 * Class: OpenLayers.Control.WMTSGetFeatureInfo
 * The WMTSGetFeatureInfo control uses a WMTS query to get information about a 
 *     point on the map.  The information may be in a display-friendly format 
 *     such as HTML, or a machine-friendly format such as GML, depending on the 
 *     server's capabilities and the client's configuration.  This control 
 *     handles click or hover events, attempts to parse the results using an 
 *     OpenLayers.Format, and fires a 'getfeatureinfo' event for each layer
 *     queried.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.WMTSGetFeatureInfo = OpenLayers.Class(OpenLayers.Control, {

   /**
     * APIProperty: hover
     * {Boolean} Send GetFeatureInfo requests when mouse stops moving.
     *     Default is false.
     */
    hover: false,
    
    /**
     * Property: requestEncoding
     * {String} One of "KVP" or "REST".  Only KVP encoding is supported at this 
     *     time.
     */
    requestEncoding: "KVP",

    /**
     * APIProperty: drillDown
     * {Boolean} Drill down over all WMTS layers in the map. When
     *     using drillDown mode, hover is not possible.  A getfeatureinfo event
     *     will be fired for each layer queried.
     */
    drillDown: false,

    /**
     * APIProperty: maxFeatures
     * {Integer} Maximum number of features to return from a WMTS query. This
     *     sets the feature_count parameter on WMTS GetFeatureInfo
     *     requests.
     */
    maxFeatures: 10,

    /** APIProperty: clickCallback
     *  {String} The click callback to register in the
     *      {<OpenLayers.Handler.Click>} object created when the hover
     *      option is set to false. Default is "click".
     */
    clickCallback: "click",
    
    /**
     * Property: layers
     * {Array(<OpenLayers.Layer.WMTS>)} The layers to query for feature info.
     *     If omitted, all map WMTS layers will be considered.
     */
    layers: null,

    /**
     * APIProperty: queryVisible
     * {Boolean} Filter out hidden layers when searching the map for layers to 
     *     query.  Default is true.
     */
    queryVisible: true,

    /**
     * Property: infoFormat
     * {String} The mimetype to request from the server
     */
    infoFormat: 'text/html',
    
    /**
     * Property: vendorParams
     * {Object} Additional parameters that will be added to the request, for
     * WMTS implementations that support them. This could e.g. look like
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
     * beforegetfeatureinfo - Triggered before each request is sent.
     *      The event object has an *xy* property with the position of the 
     *      mouse click or hover event that triggers the request and a *layer*
     *      property referencing the layer about to be queried.  If a listener
     *      returns false, the request will not be issued.
     * getfeatureinfo - Triggered when a GetFeatureInfo response is received.
     *      The event object has a *text* property with the body of the
     *      response (String), a *features* property with an array of the
     *      parsed features, an *xy* property with the position of the mouse
     *      click or hover event that triggered the request, a *layer* property
     *      referencing the layer queried and a *request* property with the 
     *      request itself. If drillDown is set to true, one event will be fired
     *      for each layer queried.
     * exception - Triggered when a GetFeatureInfo request fails (with a 
     *      status other than 200) or whenparsing fails.  Listeners will receive 
     *      an event with *request*, *xy*, and *layer*  properties.  In the case 
     *      of a parsing error, the event will also contain an *error* property.
     */
    EVENT_TYPES: ["beforegetfeatureinfo", "getfeatureinfo", "exception"],
    
    /** 
     * Property: pending
     * {Number}  The number of pending requests.
     */
    pending: 0,

    /**
     * Constructor: <OpenLayers.Control.WMTSGetFeatureInfo>
     *
     * Parameters:
     * options - {Object} 
     */
    initialize: function(options) {
        // concatenate events specific to vector with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.WMTSGetFeatureInfo.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );

        options = options || {};
        options.handlerOptions = options.handlerOptions || {};

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        
        if (!this.format) {
            this.format = new OpenLayers.Format.WMSGetFeatureInfo(
                options.formatOptions
            );
        }
        
        if (this.drillDown === true) {
            this.hover = false;
        }

        if (this.hover) {
            this.handler = new OpenLayers.Handler.Hover(
                this, {
                    move: this.cancelHover,
                    pause: this.getInfoForHover
                },
                OpenLayers.Util.extend(
                    this.handlerOptions.hover || {}, {delay: 250}
                )
            );
        } else {
            var callbacks = {};
            callbacks[this.clickCallback] = this.getInfoForClick;
            this.handler = new OpenLayers.Handler.Click(
                this, callbacks, this.handlerOptions.click || {}
            );
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
            --this.pending;
            if (this.pending <= 0) {
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
                this.pending = 0;
            }            
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
        var layer;
        for (var i=candidates.length-1; i>=0; --i) {
            layer = candidates[i];
            if (layer instanceof OpenLayers.Layer.WMTS &&
                layer.requestEncoding === this.requestEncoding &&
                (!this.queryVisible || layer.getVisibility())) {
                layers.push(layer);
                if (!this.drillDown || this.hover) {
                    break;
                }
            }
        }
        return layers;
    },
    
    /**
     * Method: buildRequestOptions
     * Build an object with the relevant options for the GetFeatureInfo request.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMTS>} A WMTS layer.
     * xy - {<OpenLayers.Pixel>} The position on the map where the 
     *     mouse event occurred.
     */
    buildRequestOptions: function(layer, xy) {
        var loc = this.map.getLonLatFromPixel(xy);
        var getTileUrl = layer.getURL(
            new OpenLayers.Bounds(loc.lon, loc.lat, loc.lon, loc.lat)
        );
        var params = OpenLayers.Util.getParameters(getTileUrl);
        var tileInfo = layer.getTileInfo(loc);
        OpenLayers.Util.extend(params, {
            service: "WMTS",
            version: layer.version,
            request: "GetFeatureInfo",
            infoFormat: this.infoFormat,
            i: tileInfo.i,
            j: tileInfo.j
        });
        OpenLayers.Util.applyDefaults(params, this.vendorParams);
        return {
            url: layer.url instanceof Array ? layer.url[0] : layer.url,
            params: OpenLayers.Util.upperCaseObject(params),
            callback: function(request) {
                this.handleResponse(xy, request, layer);
            },
            scope: this
        };
    },

    /**
     * Method: request
     * Sends a GetFeatureInfo request to the WMTS
     * 
     * Parameters:
     * xy - {<OpenLayers.Pixel>} The position on the map where the mouse event 
     *     occurred.
     * options - {Object} additional options for this method.
     * 
     * Valid options:
     * - *hover* {Boolean} true if we do the request for the hover handler
     */
    request: function(xy, options) {
        options = options || {};
        var layers = this.findLayers();
        if (layers.length > 0) {
            var issue, layer;
            for (var i=0, len=layers.length; i<len; i++) {
                layer = layers[i];
                issue = this.events.triggerEvent("beforegetfeatureinfo", {
                    xy: xy,
                    layer: layer
                });
                if (issue !== false) {
                    ++this.pending;
                    var requestOptions = this.buildRequestOptions(layer, xy);
                    var request = OpenLayers.Request.GET(requestOptions);
                    if (options.hover === true) {
                        this.hoverRequest = request;
                    }
                }
            }
            if (this.pending > 0) {
                OpenLayers.Element.addClass(this.map.viewPortDiv, "olCursorWait");
            }
        }
    },

    /**
     * Method: handleResponse
     * Handler for the GetFeatureInfo response.
     * 
     * Parameters:
     * xy - {<OpenLayers.Pixel>} The position on the map where the mouse event 
     *     occurred.
     * request - {XMLHttpRequest} The request object.
     * layer - {<OpenLayers.Layer.WMTS>} The queried layer.
     */
    handleResponse: function(xy, request, layer) {
        --this.pending;
        if (this.pending <= 0) {
            OpenLayers.Element.removeClass(this.map.viewPortDiv, "olCursorWait");
            this.pending = 0;
        }
        if (request.status && (request.status < 200 || request.status >= 300)) {
            this.events.triggerEvent("exception", {
                xy: xy, 
                request: request,
                layer: layer
            });
        } else {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            var features, except;
            try {
                features = this.format.read(doc);
            } catch (error) {
                except = true;
                this.events.triggerEvent("exception", {
                    xy: xy,
                    request: request,
                    error: error,
                    layer: layer
                });
            }
            if (!except) {
                this.events.triggerEvent("getfeatureinfo", {
                    text: request.responseText,
                    features: features,
                    request: request,
                    xy: xy,
                    layer: layer
                });
            }
        }
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

    CLASS_NAME: "OpenLayers.Control.WMTSGetFeatureInfo"
});
