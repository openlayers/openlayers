/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @class
 * 
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/Markers.js
 */
OpenLayers.Layer.WFS = OpenLayers.Class.create();
OpenLayers.Layer.WFS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Layer.Vector, OpenLayers.Layer.Markers, {

    /** WFS layer is never a base layer. 
     * 
     * @type Boolean
     */
    isBaseLayer: false,
    
    /** the ratio of image/tile size to map size (this is the untiled buffer)
     * @type int */
    ratio: 2,

    /** Hashtable of default key/value parameters
     * @final @type Object */
    DEFAULT_PARAMS: { service: "WFS",
                      version: "1.0.0",
                      request: "GetFeature"
                    },
    
    /** 
     * If featureClass is defined, an old-style markers based
     * WFS layer is created instead of a new-style vector layer.
     * If sent, this should be a subclass of OpenLayers.Feature
     *
     * @type OpenLayers.Feature 
     */
    featureClass: null,

    /**
     * Should be calculated automatically.
     *
     * @type Boolean
     */
    vectorMode: true, 

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} url
    * @param {Object} params
    * @param {Object} options Hashtable of extra options to tag onto the layer
    */
    initialize: function(name, url, params, options) {
        if (options == undefined) { options = {}; } 
        
        if (options.featureClass || !OpenLayers.Layer.Vector || !OpenLayers.Feature.Vector) {
            this.vectorMode = false;
        }    
        
        // Turn off error reporting, browsers like Safari may work
        // depending on the setup, and we don't want an unneccesary alert.
        OpenLayers.Util.extend(options, {'reportError': false});
        var newArguments=new Array()
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
        if (!this.renderer || !this.vectorMode) {
            this.vectorMode = false; 
            if (!options.featureClass) {
                options.featureClass = OpenLayers.Feature.WFS;
            }   
            OpenLayers.Layer.Markers.prototype.initialize.apply(this, newArguments);
        }
        
        if (this.params && this.params.typename && !this.options.typename) {
            this.options.typename = this.params.typename;
        }
        
        if (!this.options.geometry_column) {
            this.options.geometry_column = "the_geom";
        }    
        
        this.params = params;
        OpenLayers.Util.applyDefaults(
                       this.params, 
                       OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
                       );
        this.url = url;
    },    
    

    /**
     * 
     */
    destroy: function() {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.destroy.apply(this, arguments);
        } else {    
            OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
        }    
    },
    
    /**
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.setMap.apply(this, arguments);
        } else {    
            OpenLayers.Layer.Markers.prototype.setMap.apply(this, arguments);
        }    
    },
    
    /** 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} dragging
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.moveTo.apply(this, arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.moveTo.apply(this, arguments);
        }    

        // don't load wfs features while dragging, wait for drag end
        if (dragging) {
            // TBD try to hide the vector layer while dragging
            // this.setVisibility(false);
            // this will probably help for panning performances
            return false;
        }
        
        if ( zoomChanged ) {
            if (this.vectorMode) {
                this.renderer.clear();
            }
        }
        
        // don't load data if current zoom level doesn't match
        if (this.options.minZoomLevel && this.map.getZoom() < this.options.minZoomLevel) {
            return null;
        };
        
        if (bounds == null) {
            bounds = this.map.getExtent();
        }

        var firstRendering = (this.tile == null);

        //does the new bounds to which we need to move fall outside of the 
        // current tile's bounds?
        var outOfBounds = (!firstRendering &&
                           !this.tile.bounds.containsBounds(bounds));

        if ( zoomChanged || firstRendering || (!dragging && outOfBounds) ) {
            //determine new tile bounds
            var center = bounds.getCenterLonLat();
            var tileWidth = bounds.getWidth() * this.ratio;
            var tileHeight = bounds.getHeight() * this.ratio;
            var tileBounds = 
                new OpenLayers.Bounds(center.lon - (tileWidth / 2),
                                      center.lat - (tileHeight / 2),
                                      center.lon + (tileWidth / 2),
                                      center.lat + (tileHeight / 2));

            //determine new tile size
            var tileSize = this.map.getSize();
            tileSize.w = tileSize.w * this.ratio;
            tileSize.h = tileSize.h * this.ratio;

            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(tileBounds.left, tileBounds.top);
            var pos = this.map.getLayerPxFromLonLat(ul);

            //formulate request url string
            var url = this.getFullRequestString();
        
            var params = { BBOX:tileBounds.toBBOX() };
            url += "&" + OpenLayers.Util.getParameterString(params);

            if (!this.tile) {
                this.tile = new OpenLayers.Tile.WFS(this, pos, tileBounds, 
                                                     url, tileSize);
                this.tile.draw();
            } else {
                if (this.vectorMode) {
                    this.renderer.clear();
                } else {
                    this.clearMarkers();
                }    
                this.tile.destroy();
                
                this.tile = null;
                this.tile = new OpenLayers.Tile.WFS(this, pos, tileBounds, 
                                                     url, tileSize);
                this.tile.draw();
            } 
        }
    },
        
    /**
     * @param {Object} obj
     * 
     * @returns An exact clone of this OpenLayers.Layer.WMS
     * @type OpenLayers.Layer.WMS
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.WFS(this.name,
                                           this.url,
                                           this.params,
                                           this.options);
        }

        //get all additions from superclasses
        if (this.vectorMode) {
            obj = OpenLayers.Layer.Vector.prototype.clone.apply(this, [obj]);
        } else {
            obj = OpenLayers.Layer.Markers.prototype.clone.apply(this, [obj]);
        }    

        // copy/set any non-init, non-simple values here

        return obj;
    },

    /** combine the layer's url with its params and these newParams. 
    *   
    *    Add the SRS parameter from 'projection' -- this is probably
    *     more eloquently done via a setProjection() method, but this 
    *     works for now and always.
    * 
    * @param {Object} newParams
    * 
    * @type String
    */
    getFullRequestString:function(newParams) {
        var projection = this.map.getProjection();
        this.params.SRS = (projection == "none") ? null : projection;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
    
    commit: function() {
        if (!this.writer) {
            this.writer = new OpenLayers.Format.WFS({},this);
        }

        var data = this.writer.write(this.features);
        
        var url = this.url;
        if (OpenLayers.ProxyHost && this.url.startsWith("http")) {
            url = OpenLayers.ProxyHost + escape(this.url);
        }

        var success = this.commitSuccess.bind(this);

        var failure = this.commitFailure.bind(this)
        
        data = OpenLayers.Ajax.serializeXMLToString(data);
        
        // from prototype.js
        new OpenLayers.Ajax.Request(url, 
                         {   method: 'post', 
                             postBody: data,
                             onComplete: success, 
                             onFailure: failure
                          }
                         );
    },

    /**
     * Called when the Ajax request returns a response
     *
     * @param {XmlNode} response from server
     */
    commitSuccess: function(request) {
        var response = request.responseText;
        if (response.indexOf('SUCCESS') != -1) {
            this.report('WFS Transaction: SUCCESS', response);
            
            for(var i = 0; i < this.features.length; i++) {
                i.state = null;
            }    
            // TBD redraw the layer or reset the state of features
            // foreach features: set state to null
        } else if (response.indexOf('FAILED') != -1 ||
            response.indexOf('Exception') != -1) {
            this.report('WFS Transaction: FAILED', response);
        }
    },
    
    /**
     * Called when the Ajax request fails
     *
     * @param {XmlNode} response from server
     */
    commitFailure: function(request) {},
    
    /**
     * Called with a 'success' message if the commit succeeded, otherwise
     * a failure message, and the full text as a second parameter.
     *
     * @param {String} string reporting string
     * @param {String} response full XML response
     */
    commitReport: function(string, response) {
        alert(string);
    },

    
    /**
     * Refreshes all the features of the layer
     */
    refresh: function() {
        if (this.tile) {
            if (this.vectorMode) {
                this.renderer.clear();
                OpenLayers.Util.clearArray(this.features);
            } else {   
                this.clearMarkers();
                OpenLayers.Util.clearArray(this.markers);
            }    
            this.tile.draw();
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WFS"
});
