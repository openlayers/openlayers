/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


/**
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Layer/Markers.js
 *
 * Class: OpenLayers.Layer.WFS
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 *  - <OpenLayers.Layer.Markers>
 */
OpenLayers.Layer.WFS = OpenLayers.Class(
  OpenLayers.Layer.Vector, OpenLayers.Layer.Markers, {

    /**
     * APIProperty: isBaseLayer
     * {Boolean} WFS layer is not a base layer by default. 
     */
    isBaseLayer: false,
    
    /**
     * Property: tile
     * {<OpenLayers.Tile.WFS>}
     */
    tile: null,    
    
    /**
     * APIProperty: ratio
     * {Float} the ratio of image/tile size to map size (this is the untiled
     *     buffer)
     */
    ratio: 2,

    /**  
     * Property: DEFAULT_PARAMS
     * {Object} Hashtable of default key/value parameters
     */
    DEFAULT_PARAMS: { service: "WFS",
                      version: "1.0.0",
                      request: "GetFeature"
                    },
    
    /** 
     * APIProperty: featureClass
     * {<OpenLayers.Feature>} If featureClass is defined, an old-style markers
     *     based WFS layer is created instead of a new-style vector layer. If
     *     sent, this should be a subclass of OpenLayers.Feature
     */
    featureClass: null,

    /**
     * Property: vectorMode
     * {Boolean} Should be calculated automatically.
     */
    vectorMode: true, 
    
    /**
     * APIProperty: encodeBBOX
     * {Boolean} Should the BBOX commas be encoded? The WMS spec says 'no', 
     *     but some services want it that way. Default false.
     */
    encodeBBOX: false,
    
    /**
     * APIProperty: extractAttributes 
     * {Boolean} Should the WFS layer parse attributes from the retrieved
     *     GML? Defaults to false. If enabled, parsing is slower, but 
     *     attributes are available in the attributes property of 
     *     layer features.
     */
    extractAttributes: false,

    /**
     * Constructor: OpenLayers.Layer.WFS
     *
     * Parameters:
     * name - {String} 
     * url - {String} 
     * params - {Object} 
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, params, options) {
        if (options == undefined) { options = {}; } 
        
        if (options.featureClass || 
            !OpenLayers.Layer.Vector || 
            !OpenLayers.Feature.Vector) {
            this.vectorMode = false;
        }    
        
        // Turn off error reporting, browsers like Safari may work
        // depending on the setup, and we don't want an unneccesary alert.
        OpenLayers.Util.extend(options, {'reportError': false});
        var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
        if (!this.renderer || !this.vectorMode) {
            this.vectorMode = false; 
            if (!options.featureClass) {
                options.featureClass = OpenLayers.Feature.WFS;
            }   
            OpenLayers.Layer.Markers.prototype.initialize.apply(this, 
                                                                newArguments);
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
     * APIMethod: destroy
     */
    destroy: function() {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.destroy.apply(this, arguments);
        } else {    
            OpenLayers.Layer.Markers.prototype.destroy.apply(this, arguments);
        }    
    },
    
    /**
     * Method: setMap
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        if (this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.setMap.apply(this, arguments);
        } else {    
            OpenLayers.Layer.Markers.prototype.setMap.apply(this, arguments);
        }    
    },
    
    /** 
     * Method: moveTo
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * zoomChanged - {Boolean} 
     * dragging - {Boolean} 
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
        
    //DEPRECATED - REMOVE IN 3.0
        // don't load data if current zoom level doesn't match
        if (this.options.minZoomLevel) {
            
            var err = "The minZoomLevel property is only intended for use " +
                    "with the FixedZoomLevels-descendent layers. That this " +
                    "wfs layer checks for minZoomLevel is a relic of the" +
                    "past. We cannot, however, remove it without possibly " +
                    "breaking OL based applications that may depend on it." +
                    " Therefore we are deprecating it -- the minZoomLevel " +
                    "check below will be removed at 3.0. Please instead " +
                    "use min/max resolution setting as described here: " +
                    "http://trac.openlayers.org/wiki/SettingZoomLevels";
            OpenLayers.Console.warn(err);
            
            if (this.map.getZoom() < this.options.minZoomLevel) {
                return null;
            }
        }
        
        if (bounds == null) {
            bounds = this.map.getExtent();
        }

        var firstRendering = (this.tile == null);

        //does the new bounds to which we need to move fall outside of the 
        // current tile's bounds?
        var outOfBounds = (!firstRendering &&
                           !this.tile.bounds.containsBounds(bounds));

        if ( (zoomChanged || firstRendering || (!dragging && outOfBounds))
             && this.inRange) {
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
        
            var params = {BBOX: this.encodeBBOX ? tileBounds.toBBOX() 
                                                : tileBounds.toArray()};
            url += "&" + OpenLayers.Util.getParameterString(params);

            if (!this.tile) {
                this.tile = new OpenLayers.Tile.WFS(this, pos, tileBounds, 
                                                     url, tileSize);
                this.addTileMonitoringHooks(this.tile);
                this.tile.draw();
            } else {
                if (this.vectorMode) {
                    this.destroyFeatures();
                    this.renderer.clear();
                } else {
                    this.clearMarkers();
                }    
                this.removeTileMonitoringHooks(this.tile);
                this.tile.destroy();
                
                this.tile = null;
                this.tile = new OpenLayers.Tile.WFS(this, pos, tileBounds, 
                                                     url, tileSize);
                this.addTileMonitoringHooks(this.tile);
                this.tile.draw();
            } 
        }
    },

    /** 
     * Method: addTileMonitoringHooks
     * This function takes a tile as input and adds the appropriate hooks to 
     *     the tile so that the layer can keep track of the loading tile
     *     (making sure to check that the tile is always the layer's current
     *     tile before taking any action).
     * 
     * Parameters: 
     * tile - {<OpenLayers.Tile>}
     */
    addTileMonitoringHooks: function(tile) {
        tile.onLoadStart = function() {
            //if this is the the layer's current tile, then trigger 
            // a 'loadstart'
            if (this == this.layer.tile) {
                this.layer.events.triggerEvent("loadstart");
            }
        };
        tile.events.register("loadstart", tile, tile.onLoadStart);
      
        tile.onLoadEnd = function() {
            //if this is the the layer's current tile, then trigger 
            // a 'tileloaded' and 'loadend'
            if (this == this.layer.tile) {
                this.layer.events.triggerEvent("tileloaded");
                this.layer.events.triggerEvent("loadend");
            }
        };
        tile.events.register("loadend", tile, tile.onLoadEnd);
    },
    
    /** 
     * Method: removeTileMonitoringHooks
     * This function takes a tile as input and removes the tile hooks 
     *     that were added in addTileMonitoringHooks()
     * 
     * Parameters: 
     * tile - {<OpenLayers.Tile>}
     */
    removeTileMonitoringHooks: function(tile) {
        tile.events.unregister("loadstart", tile, tile.onLoadStart);
        tile.events.unregister("loadend", tile, tile.onLoadEnd);
    },

    /**
     * Method: onMapResize
     * Call the onMapResize method of the appropriate parent class. 
     */
    onMapResize: function() {
        if(this.vectorMode) {
            OpenLayers.Layer.Vector.prototype.onMapResize.apply(this, 
                                                                arguments);
        } else {
            OpenLayers.Layer.Markers.prototype.onMapResize.apply(this, 
                                                                 arguments);
        }
    },
    
    /**
     * APIMethod: mergeNewParams
     * Modify parameters for the layer and redraw.
     * 
     * Parameters:
     * newParams - {Object}
     */
    mergeNewParams:function(newParams) {
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        OpenLayers.Layer.HTTPRequest.prototype.mergeNewParams.apply(this, 
                                                                 newArguments);
    },

    /**
     * APIMethod: clone
     *
     * Parameters:
     * obj - {Object} 
     * 
     * Returns:
     * {<OpenLayers.Layer.WFS>} An exact clone of this OpenLayers.Layer.WFS
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

    /** 
     * APIMethod: getFullRequestString
     * combine the layer's url with its params and these newParams. 
     *   
     *    Add the SRS parameter from 'projection' -- this is probably
     *     more eloquently done via a setProjection() method, but this 
     *     works for now and always.
     *
     * Parameters:
     * newParams - {Object} 
     * altUrl - {String} Use this as the url instead of the layer's url
     */
    getFullRequestString:function(newParams, altUrl) {
        var projection = this.map.getProjection();
        this.params.SRS = (projection == "none") ? null : projection;

        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(
                                                    this, arguments);
    },
   
    /**
     * APIMethod: commit
     * Write out the data to a WFS server.
     */
    commit: function() {
        if (!this.writer) {
            this.writer = new OpenLayers.Format.WFS({},this);
        }

        var data = this.writer.write(this.features);
        
        var url = this.url;
        if (OpenLayers.ProxyHost &&
            OpenLayers.String.startsWith(this.url, "http")) {
            url = OpenLayers.ProxyHost + escape(this.url);
        }

        var success = OpenLayers.Function.bind(this.commitSuccess, this);

        var failure = OpenLayers.Function.bind(this.commitFailure, this);
        
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
     * Method: commitSuccess
     * Called when the Ajax request returns a response
     *
     * Parameters:
     * response - {XmlNode} from server
     */
    commitSuccess: function(request) {
        var response = request.responseText;
        if (response.indexOf('SUCCESS') != -1) {
            this.commitReport('WFS Transaction: SUCCESS', response);
            
            for(var i = 0; i < this.features.length; i++) {
                this.features[i].state = null;
            }    
            // TBD redraw the layer or reset the state of features
            // foreach features: set state to null
        } else if (response.indexOf('FAILED') != -1 ||
            response.indexOf('Exception') != -1) {
            this.commitReport('WFS Transaction: FAILED', response);
        }
    },
    
    /**
     * Method: commitFailure
     * Called when the Ajax request fails
     *
     * Parameters:
     * response - {XmlNode} from server
     */
    commitFailure: function(request) {},
    
    /**
     * APIMethod: commitReport 
     * Called with a 'success' message if the commit succeeded, otherwise
     *     a failure message, and the full request text as a second parameter.
     *     Override this function to provide custom transaction reporting.
     *
     * string - {String} reporting string
     * response - {String} full XML response
     */
    commitReport: function(string, response) {
        alert(string);
    },

    
    /**
     * APIMethod: refresh
     * Refreshes all the features of the layer
     */
    refresh: function() {
        if (this.tile) {
            if (this.vectorMode) {
                this.renderer.clear();
                this.features.length = 0;
            } else {   
                this.clearMarkers();
                this.markers.length = 0;
            }    
            this.tile.draw();
        }
    },

    CLASS_NAME: "OpenLayers.Layer.WFS"
});
