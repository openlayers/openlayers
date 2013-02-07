/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Grid.js
 * @requires OpenLayers/Format/ArcXML.js
 * @requires OpenLayers/Request.js
 */

/**
 * Class: OpenLayers.Layer.ArcIMS
 * Instances of OpenLayers.Layer.ArcIMS are used to display data from ESRI ArcIMS
 *     Mapping Services. Create a new ArcIMS layer with the <OpenLayers.Layer.ArcIMS>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.ArcIMS = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
     * Constant: DEFAULT_PARAMS
     * {Object} Default query string parameters.
     */
    DEFAULT_PARAMS: { 
        ClientVersion: "9.2",
        ServiceName: ''
    },
    
    /**
     * APIProperty: featureCoordSys
     * {String} Code for feature coordinate system.  Default is "4326".
     */
    featureCoordSys: "4326",
    
    /**
     * APIProperty: filterCoordSys
     * {String} Code for filter coordinate system.  Default is "4326".
     */
    filterCoordSys: "4326",
    
    /**
     * APIProperty: layers
     * {Array} An array of objects with layer properties.
     */
    layers: null,
    
    /**
     * APIProperty: async
     * {Boolean} Request images asynchronously.  Default is true.
     */
    async: true,
    
    /**
     * APIProperty: name
     * {String} Layer name.  Default is "ArcIMS".
     */
    name: "ArcIMS",

    /**
     * APIProperty: isBaseLayer
     * {Boolean} The layer is a base layer.  Default is true.
     */
    isBaseLayer: true,

    /**
     * Constant: DEFAULT_OPTIONS
     * {Object} Default layers properties.
     */
    DEFAULT_OPTIONS: {
        tileSize: new OpenLayers.Size(512, 512),
        featureCoordSys: "4326",
        filterCoordSys: "4326",
        layers: null,
        isBaseLayer: true,
        async: true,
        name: "ArcIMS"
    }, 
 
    /**
     * Constructor: OpenLayers.Layer.ArcIMS
     * Create a new ArcIMS layer object.
     *
     * Example:
     * (code)
     * var arcims = new OpenLayers.Layer.ArcIMS(
     *     "Global Sample",
     *     "http://sample.avencia.com/servlet/com.esri.esrimap.Esrimap", 
     *     {
     *         service: "OpenLayers_Sample", 
     *         layers: [
     *             // layers to manipulate
     *             {id: "1", visible: true}
     *         ]
     *     }
     * );
     * (end)
     *
     * Parameters:
     * name - {String} A name for the layer
     * url - {String} Base url for the ArcIMS server
     * options - {Object} Optional object with properties to be set on the
     *     layer.
     */
    initialize: function(name, url, options) {
        
        this.tileSize = new OpenLayers.Size(512, 512);

        // parameters
        this.params = OpenLayers.Util.applyDefaults(
            {ServiceName: options.serviceName},
            this.DEFAULT_PARAMS
        );
        this.options = OpenLayers.Util.applyDefaults(
            options, this.DEFAULT_OPTIONS
        );
          
        OpenLayers.Layer.Grid.prototype.initialize.apply(
            this, [name, url, this.params, options]
        );

        //layer is transparent        
        if (this.transparent) {
            
            // unless explicitly set in options, make layer an overlay
            if (!this.isBaseLayer) {
                this.isBaseLayer = false;
            } 
            
            // jpegs can never be transparent, so intelligently switch the 
            //  format, depending on the browser's capabilities
            if (this.format == "image/jpeg") {
                this.format = OpenLayers.Util.alphaHack() ? "image/gif" : "image/png";
            }
        }

        // create an empty layer list if no layers specified in the options
        if (this.options.layers === null) {
            this.options.layers = [];
        }
    },    

    /**
     * Method: getURL
     * Return an image url this layer.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} A bounds representing the bbox for the
     *     request.
     *
     * Returns:
     * {String} A string with the map image's url.
     */
    getURL: function(bounds) {
        var url = "";
        bounds = this.adjustBounds(bounds);
        
        // create an arcxml request to generate the image
        var axlReq = new OpenLayers.Format.ArcXML( 
            OpenLayers.Util.extend(this.options, {
                requesttype: "image",
                envelope: bounds.toArray(),
                tileSize: this.tileSize
            })
        );
        
        // create a synchronous ajax request to get an arcims image
        var req = new OpenLayers.Request.POST({
            url: this.getFullRequestString(),
            data: axlReq.write(),
            async: false
        });
        
        // if the response exists
        if (req != null) {
            var doc = req.responseXML;

            if (!doc || !doc.documentElement) {            
                doc = req.responseText;
            }

            // create a new arcxml format to read the response
            var axlResp = new OpenLayers.Format.ArcXML();
            var arcxml = axlResp.read(doc);
            url = this.getUrlOrImage(arcxml.image.output);
        }
        
        return url;
    },
    
    
    /**
     * Method: getURLasync
     * Get an image url this layer asynchronously, and execute a callback
     *     when the image url is generated.
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} A bounds representing the bbox for the
     *     request.
     * callback - {Function} Function to call when image url is retrieved.
     * scope - {Object} The scope of the callback method.
     */
    getURLasync: function(bounds, callback, scope) {
        bounds = this.adjustBounds(bounds);
        
        // create an arcxml request to generate the image
        var axlReq = new OpenLayers.Format.ArcXML(  
            OpenLayers.Util.extend(this.options, { 
                requesttype: "image",
                envelope: bounds.toArray(),
                tileSize: this.tileSize
            })
        );
        
        // create an asynchronous ajax request to get an arcims image
        OpenLayers.Request.POST({
            url: this.getFullRequestString(),
            async: true,
            data: axlReq.write(),
            callback: function(req) {
                // process the response from ArcIMS, and call the callback function
                // to set the image URL
                var doc = req.responseXML;
                if (!doc || !doc.documentElement) {            
                    doc = req.responseText;
                }

                // create a new arcxml format to read the response
                var axlResp = new OpenLayers.Format.ArcXML();
                var arcxml = axlResp.read(doc);
                
                callback.call(scope, this.getUrlOrImage(arcxml.image.output));
            },
            scope: this
        });
    },
    
    /**
     * Method: getUrlOrImage
     * Extract a url or image from the ArcXML image output.
     *
     * Parameters:
     * output - {Object} The image.output property of the object returned from
     *     the ArcXML format read method.
     *
     * Returns:
     * {String} A URL for an image (potentially with the data protocol).
     */
    getUrlOrImage: function(output) {
        var ret = "";
        if(output.url) {
            // If the image response output url is a string, then the image
            // data is not inline.
            ret = output.url;
        } else if(output.data) {
            // The image data is inline and base64 encoded, create a data
            // url for the image.  This will only work for small images,
            // due to browser url length limits.
            ret = "data:image/" + output.type + 
                  ";base64," + output.data;
        }
        return ret;
    },
    
    /**
     * Method: setLayerQuery
     * Set the query definition on this layer. Query definitions are used to
     *     render parts of the spatial data in an image, and can be used to
     *     filter features or layers in the ArcIMS service.
     *
     * Parameters:
     * id - {String} The ArcIMS layer ID.
     * querydef - {Object} The query definition to apply to this layer.
     */
    setLayerQuery: function(id, querydef) {
        // find the matching layer, if it exists
        for (var lyr = 0; lyr < this.options.layers.length; lyr++) {
            if (id == this.options.layers[lyr].id) {
                // replace this layer definition
                this.options.layers[lyr].query = querydef;
                return;
            }
        }
      
        // no layer found, create a new definition
        this.options.layers.push({id: id, visible: true, query: querydef});
    },
    
    /**
     * Method: getFeatureInfo
     * Get feature information from ArcIMS.  Using the applied geometry, apply
     *     the options to the query (buffer, area/envelope intersection), and
     *     query the ArcIMS service.
     *
     * A note about accuracy:
     * ArcIMS interprets the accuracy attribute in feature requests to be
     *     something like the 'modulus' operator on feature coordinates,
     *     applied to the database geometry of the feature.  It doesn't round,
     *     so your feature coordinates may be up to (1 x accuracy) offset from
     *     the actual feature coordinates.  If the accuracy of the layer is not
     *     specified, the accuracy will be computed to be approximately 1
     *     feature coordinate per screen  pixel.
     *
     * Parameters:
     * geometry - {<OpenLayers.LonLat>} or {<OpenLayers.Geometry.Polygon>} The
     *     geometry to use when making the query. This should be a closed
     *     polygon for behavior approximating a free selection.
     * layer - {Object} The ArcIMS layer definition. This is an anonymous object
     *     that looks like:
     * (code)
     * {
     *     id: "ArcXML layer ID",  // the ArcXML layer ID
     *     query: {
     *         where: "STATE = 'PA'",  // the where clause of the query
     *         accuracy: 100           // the accuracy of the returned feature
     *     }
     * }
     * (end)
     * options - {Object} Object with non-default properties to set on the layer.
     *     Supported properties are buffer, callback, scope, and any other
     *     properties applicable to the ArcXML format.  Set the 'callback' and
     *     'scope' for an object and function to recieve the parsed features
     *     from ArcIMS.
     */
    getFeatureInfo: function(geometry, layer, options) {
        // set the buffer to 1 unit (dd/m/ft?) by default
        var buffer = options.buffer || 1;
        // empty callback by default
        var callback = options.callback || function() {};
        // default scope is window (global)
        var scope = options.scope || window;

        // apply these option to the request options
        var requestOptions = {};
        OpenLayers.Util.extend(requestOptions, this.options);

        // this is a feature request
        requestOptions.requesttype = "feature";

        if (geometry instanceof OpenLayers.LonLat) {
            // create an envelope if the geometry is really a lon/lat
            requestOptions.polygon = null;
            requestOptions.envelope = [ 
                geometry.lon - buffer, 
                geometry.lat - buffer,
                geometry.lon + buffer,
                geometry.lat + buffer
            ];
        } else if (geometry instanceof OpenLayers.Geometry.Polygon) {
            // use the polygon assigned, and empty the envelope
            requestOptions.envelope = null;
            requestOptions.polygon = geometry;
        }
      
        // create an arcxml request to get feature requests
        var arcxml = new OpenLayers.Format.ArcXML(requestOptions);

        // apply any get feature options to the arcxml request
        OpenLayers.Util.extend(arcxml.request.get_feature, options);

        arcxml.request.get_feature.layer = layer.id;
        if (typeof layer.query.accuracy == "number") {
            // set the accuracy if it was specified
            arcxml.request.get_feature.query.accuracy = layer.query.accuracy;
        } else {
            // guess that the accuracy is 1 per screen pixel
            var mapCenter = this.map.getCenter();
            var viewPx = this.map.getViewPortPxFromLonLat(mapCenter);
            viewPx.x++;
            var mapOffCenter = this.map.getLonLatFromPixel(viewPx);
            arcxml.request.get_feature.query.accuracy = mapOffCenter.lon - mapCenter.lon;
        }
        
        // set the get_feature query to be the same as the layer passed in
        arcxml.request.get_feature.query.where = layer.query.where;
        
        // use area_intersection
        arcxml.request.get_feature.query.spatialfilter.relation = "area_intersection";
      
        // create a new asynchronous request to get the feature info
        OpenLayers.Request.POST({
            url: this.getFullRequestString({'CustomService': 'Query'}),
            data: arcxml.write(),
            callback: function(request) {
                // parse the arcxml response
                var response = arcxml.parseResponse(request.responseText);
                
                if (!arcxml.iserror()) {
                    // if the arcxml is not an error, call the callback with the features parsed
                    callback.call(scope, response.features);
                } else {
                    // if the arcxml is an error, return null features selected
                    callback.call(scope, null);
                }
            }
        });
    },

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.ArcIMS>} An exact clone of this layer
     */
    clone: function (obj) {

        if (obj == null) {
            obj = new OpenLayers.Layer.ArcIMS(this.name,
                                           this.url,
                                           this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },
    
    CLASS_NAME: "OpenLayers.Layer.ArcIMS"
});
