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
     * {Boolean} Send WMS request on mouse moves. This will cause the
     *     "hoverfeature" and "outfeature" events to be triggered.
     *     Default is false.
     */
    hover: false,

    /**
     * APIProperty: maxFeatures
     * {Integer} maximum number of features to return from a WMS query. This
     * has the same effect as the feature_count parameter on WMS GetFeatureInfo
     * requests. Will be ignored for box selections.
     */
    maxFeatures: 10,
    
    /**
     * Property: layers
     * {<Array(OpenLayers.Layer.WMS>} The Layer objects for which to find
     * feature info.  If omitted, search all WMS layers from the map whose url
     * is the same as the one in this control's configuration.  See the
     * <queryVisible> property
     */
    layers: null,

    /**
     * Property: queryVisible
     * {Boolean} If true, filter out hidden layers when searching the map for
     * layers to query.  If an explicit layers parameter is set, then this does
     * nothing.
     */
    queryVisible: false,

    /**
     * Property: url
     * {String} The URL of the WMS service to use.
     */
    url: null,

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
     * Property: formats
     * An object mapping from mime-types to OL Format objects to use when
     * parsing GFI responses. The default mapping is
     * (start code)
     * {
     *     'application/vnd.ogc.gml': new OpenLayers.Format.WMSGetFeatureInfo()
     * }
     * (end)
     * An object provided here will extend the default mapping.
     */
    formats: null,    

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
     * Supported event types:
     *  - *getfeatureinfo* Triggered when a GetFeatureInfo response is received.
     *      The event object has a text property with:
     *      text: a string containing the body of the response,
     *      features: an array of the parsed features, if parsing succeeded. 
     *      xy: the position of the mouse click or hover event that
     *      triggered the request
     */
    EVENT_TYPES: ["getfeatureinfo"],

    /**
     * Constructor: <OpenLayers.Control.SelectFeature>
     *
     * Parameters:
     * url - {String} 
     * options - {Object} 
     */
    initialize: function(url, options) {
        // concatenate events specific to vector with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.WMSGetFeatureInfo.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );

        options = options || {};
        options.handlerOptions = options.handlerOptions || {};

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.url = url;
        this.layers = options.layers;

        this.formats = OpenLayers.Util.extend({
            'application/vnd.ogc.gml': new OpenLayers.Format.WMSGetFeatureInfo()
        }, options.formats);


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
     * inspecting the map or using a client-provided array
     */
    findLayers: function() {
        if (this.layers) return this.layers;

        var layers = [];

        for (var i = 0, len = this.map.layers.length; i < len; i++) {
            var mapLayer = this.map.layers[i];
            if (mapLayer instanceof OpenLayers.Layer.WMS
                && mapLayer.url === this.url 
                && (!this.queryVisible || mapLayer.getVisibility())) {

                layers.push(mapLayer);
            }
        }

        return layers;
    },

    /**
     * Method: request
     * Sends a GetFeatureInfo request to the WMS
     * 
     * Parameters:
     * clickPosition - The position on the map where the mouse event occurred
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
                request: 'getfeatureinfo',
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
            callback: this.handleResponse,
            scope: OpenLayers.Util.extend({
                xy: clickPosition
            }, this) 
        };

        var response = OpenLayers.Request.GET(wmsOptions);

        if (options.hover === true) {
            this.hoverRequest = response.priv;
        }
    },
    
    /**
     * Method: handleResponse
     * Handler for the GetFeatureInfo response. Will be called in an extended
     * scope of this instance plus an xy property with the click position.
     *
     * Parameters:
     * response - {Object}
     */
    handleResponse: function(response) {
        var features;
        var fmt = this.formats[
            response.getResponseHeader("Content-type").split(";")[0]
        ];
        if (fmt) {
            features = fmt.read(response.responseXml ||
                response.responseText);
        }

        this.events.triggerEvent("getfeatureinfo", {
            text: response.responseText,
            features: features,
            xy: this.xy
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
