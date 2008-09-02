/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * licence.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Request/XMLHttpRequest.js
 * @requires OpenLayers/Layer/Grid.js
 */

/**
 * Class: OpenLayers.Layer.MapGuide
 * Instances of OpenLayers.Layer.MapGuide are used to display
 * data from a MapGuide OS instance.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Grid>
 */
OpenLayers.Layer.MapGuide = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /** 
     * APIProperty: isBaseLayer
     * {Boolean} Treat this layer as a base layer.  Default is true.
     **/
    isBaseLayer: true,
    
    /** 
     * APIProperty: singleTile
     * {Boolean} use tile server or request single tile image. Note that using
     *    singleTile *and* isBaseLayer false is *not recommend*: it uses synchronous
     *    XMLHttpRequests to load tiles, and this will *lock up users browsers*
     *    during requests if the server fails to respond.
     **/
    singleTile: false,
    
    /**
     * Constant: TILE_PARAMS
     * {Object} Hashtable of default parameter key/value pairs for tiled layer
     */
    TILE_PARAMS: {
         operation: 'GETTILEIMAGE',
         version: '1.2.0'
    },

    /**
     * Constant: SINGLE_TILE_PARAMS
     * {Object} Hashtable of default parameter key/value pairs for untiled layer
     */
    SINGLE_TILE_PARAMS: {
        operation: 'GETMAPIMAGE',
        format: 'PNG',
        locale: 'en',
        clip: '1',
        version: '1.0.0'
    },
    
    /** 
     * Property: defaultSize
     * {<OpenLayers.Size>} Tile size as produced by MapGuide server
     **/
    defaultSize: new OpenLayers.Size(300,300),

    /**
     * Constructor: OpenLayers.Layer.MapGuide
     * Create a new Mapguide layer, either tiled or untiled.  
     *
     * For tiled layers, the 'groupName' and 'mapDefinition' values 
     * must be specified as parameters in the constructor.
     *
     * For untiled base layers, specify either combination of 'mapName' and
     * 'session', or 'mapDefinition' and 'locale'.  
     *
     * For untiled overlay layers (singleTile=true and isBaseLayer=false), 
     * mapName and session are required parameters for the Layer constructor.  
     * Also NOTE: untiled overlay layers issues a synchronous AJAX request 
     * before the image request can be issued so the users browser may lock
     * up if the MG Web tier does not respond in a timely fashion.
     *
     * NOTE: MapGuide OS uses a DPI value and degrees to meters conversion 
     * factor that are different than the defaults used in OpenLayers, 
     * so these must be adjusted accordingly in your application.  
     * See the MapGuide example for how to set these values for MGOS.
     *
     * Parameters:
     * name - {String} Name of the layer displayed in the interface
     * url - {String} Location of the MapGuide mapagent executable
     *            (e.g. http://localhost:8008/mapguide/mapagent/mapagent.fcgi)
     * params - {Object} hashtable of additional parameters to use. Some
     *     parameters may require additional code on the server. The ones that
     *     you may want to use are: 
     *   - mapDefinition - {String} The MapGuide resource definition
     *            (e.g. Library://Samples/Gmap/Maps/gmapTiled.MapDefinition)
     *   - locale - Locale setting 
     *            (for untiled overlays layers only)
     *   - mapName - {String} Name of the map as stored in the MapGuide session.
     *          (for untiled layers with a session parameter only)
     *   - session - { String} MapGuide session ID 
     *            (for untiled overlays layers only)
     *   - basemaplayergroupname - {String} GroupName for tiled MapGuide layers only
     *   - format - Image format to be returned (for untiled overlay layers only)
     *   - showLayers - {String} A comma separated list of GUID's for the
     *       layers to display eg: 'cvc-xcv34,453-345-345sdf'.
     *   - hideLayers - {String} A comma separated list of GUID's for the
     *       layers to hide eg: 'cvc-xcv34,453-345-345sdf'.
     *   - showGroups - {String} A comma separated list of GUID's for the
     *       groups to display eg: 'cvc-xcv34,453-345-345sdf'.
     *   - hideGroups - {String} A comma separated list of GUID's for the
     *       groups to hide eg: 'cvc-xcv34,453-345-345sdf'
     *   - selectionXml - {String} A selection xml string Some server plumbing
     *       is required to read such a value.
     * options - {Ojbect} Hashtable of extra options to tag onto the layer; 
     *          will vary depending if tiled or untiled maps are being requested
     */
    initialize: function(name, url, params, options) {
        
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, arguments);
        
        // unless explicitly set in options, if the layer is transparent, 
        // it will be an overlay
        if (options == null || options.isBaseLayer == null) {
            this.isBaseLayer = ((this.transparent != "true") && 
                                (this.transparent != true));
        }

        //initialize for untiled layers
        if (this.singleTile) {
            OpenLayers.Util.applyDefaults(
                           this.params,
                           this.SINGLE_TILE_PARAMS
                           );
                           
        } else {
            //initialize for tiled layers
            OpenLayers.Util.applyDefaults(
                           this.params,
                           this.TILE_PARAMS
                           );
            this.setTileSize(this.defaultSize); 
        }
    },

    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Returns:
     * {<OpenLayers.Layer.MapGuide>} An exact clone of this layer
     */
    clone: function (obj) {
      if (obj == null) {
            obj = new OpenLayers.Layer.MapGuide(this.name,
                                           this.url,
                                           this.params,
                                           this.options);
      }
      //get all additions from superclasses
      obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

      return obj;
    },

    /**
     * Method: addTile
     * Creates a tile, initializes it, and adds it to the layer div. 
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * position - {<OpenLayers.Pixel>}
     * 
     * Returns:
     * {<OpenLayers.Tile.Image>} The added OpenLayers.Tile.Image
     */
    addTile:function(bounds,position) {
        return new OpenLayers.Tile.Image(this, position, bounds, 
                                         null, this.tileSize);
    },

    /**
     * Method: getURL
     * Return a query string for this layer
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} A bounds representing the bbox 
     *                                for the request
     *
     * Returns:
     * {String} A string with the layer's url and parameters and also 
     *          the passed-in bounds and appropriate tile size specified 
     *          as parameters.
     */
    getURL: function (bounds) {
        var url;
        var center = bounds.getCenterLonLat();
        var mapSize = this.map.getCurrentSize();

        if (this.singleTile) {
          //set up the call for GETMAPIMAGE or GETDYNAMICMAPOVERLAY
          var params = {};
          params.setdisplaydpi = OpenLayers.DOTS_PER_INCH;   
          params.setdisplayheight = mapSize.h*this.ratio;
          params.setdisplaywidth = mapSize.w*this.ratio;
          params.setviewcenterx = center.lon;
          params.setviewcentery = center.lat;
          params.setviewscale = this.map.getScale();
          
          if (!this.isBaseLayer) {
            // in this case the main image operation is remapped to this
            this.params.operation = "GETDYNAMICMAPOVERLAYIMAGE";
            
            //but we first need to call GETVISIBLEMAPEXTENT to set the extent
            var getVisParams = {};
            getVisParams = OpenLayers.Util.extend(getVisParams, params);
            getVisParams.operation = "GETVISIBLEMAPEXTENT";
            getVisParams.version = "1.0.0";
            getVisParams.session = this.params.session;
            getVisParams.mapName = this.params.mapName;
            getVisParams.format = 'text/xml';
            url = this.getFullRequestString( getVisParams );
            
            OpenLayers.Request.GET({url: url, async: false});
          }
          
          //construct the full URL
          url = this.getFullRequestString( params );
        } else {

          //tiled version
          var currentRes = this.map.getResolution();
          var colidx = Math.floor((bounds.left-this.maxExtent.left)/currentRes);
          colidx = Math.round(colidx/this.tileSize.w);
          var rowidx = Math.floor((this.maxExtent.top-bounds.top)/currentRes);
          rowidx = Math.round(rowidx/this.tileSize.h);

          url = this.getFullRequestString(
                       {
                           tilecol: colidx,
                           tilerow: rowidx,
                           scaleindex: this.resolutions.length - this.map.zoom - 1
                        });
           }
        
        return url;
    },

    /**
     * Method: getFullRequestString
     * getFullRequestString on MapGuide layers is special, because we 
     * do a regular expression replace on ',' in parameters to '+'.
     * This is why it is subclassed here.
     *
     * Parameters:
     * altUrl - {String} Alternative base URL to use.
     *
     * Returns:
     * {String} A string with the layer's url appropriately encoded for MapGuide
     */
    getFullRequestString:function(newParams, altUrl) {
        // use layer's url unless altUrl passed in
        var url = (altUrl == null) ? this.url : altUrl;
        
        // if url is not a string, it should be an array of strings, 
        //  in which case we will randomly select one of them in order
        //  to evenly distribute requests to different urls.
        if (typeof url == "object") {
            url = url[Math.floor(Math.random()*url.length)];
        }   
        // requestString always starts with url
        var requestString = url;        

        // create a new params hashtable with all the layer params and the 
        // new params together. then convert to string
        var allParams = OpenLayers.Util.extend({}, this.params);
        allParams = OpenLayers.Util.extend(allParams, newParams);
        // ignore parameters that are already in the url search string
        var urlParams = OpenLayers.Util.upperCaseObject(
                            OpenLayers.Util.getArgs(url));
        for(var key in allParams) {
            if(key.toUpperCase() in urlParams) {
                delete allParams[key];
            }
        }
        var paramsString = OpenLayers.Util.getParameterString(allParams);
        
        /* MapGuide needs '+' seperating things like bounds/height/width.
           Since typically this is URL encoded, we use a slight hack: we
           depend on the list-like functionality of getParameterString to
           leave ',' only in the case of list items (since otherwise it is
           encoded) then do a regular expression replace on the , characters
           to '+' */
        paramsString = paramsString.replace(/,/g, "+");
        
        if (paramsString != "") {
            var lastServerChar = url.charAt(url.length - 1);
            if ((lastServerChar == "&") || (lastServerChar == "?")) {
                requestString += paramsString;
            } else {
                if (url.indexOf('?') == -1) {
                    //serverPath has no ? -- add one
                    requestString += '?' + paramsString;
                } else {
                    //serverPath contains ?, so must already have paramsString at the end
                    requestString += '&' + paramsString;
                }
            }
        }
        return requestString;
    },

    /** 
     * Method: calculateGridLayout
     * Generate parameters for the grid layout. This  
     *
     * Parameters:
     * bounds - {<OpenLayers.Bound>}
     * extent - {<OpenLayers.Bounds>}
     * resolution - {Number}
     *
     * Returns:
     * Object containing properties tilelon, tilelat, tileoffsetlat,
     * tileoffsetlat, tileoffsetx, tileoffsety
     */
    calculateGridLayout: function(bounds, extent, resolution) {
        var tilelon = resolution * this.tileSize.w;
        var tilelat = resolution * this.tileSize.h;
        
        var offsetlon = bounds.left - extent.left;
        var tilecol = Math.floor(offsetlon/tilelon) - this.buffer;
        var tilecolremain = offsetlon/tilelon - tilecol;
        var tileoffsetx = -tilecolremain * this.tileSize.w;
        var tileoffsetlon = extent.left + tilecol * tilelon;
        
        var offsetlat = extent.top - bounds.top + tilelat; 
        var tilerow = Math.floor(offsetlat/tilelat) - this.buffer;
        var tilerowremain = tilerow - offsetlat/tilelat;
        var tileoffsety = tilerowremain * this.tileSize.h;
        var tileoffsetlat = extent.top - tilelat*tilerow;
        
        return { 
          tilelon: tilelon, tilelat: tilelat,
          tileoffsetlon: tileoffsetlon, tileoffsetlat: tileoffsetlat,
          tileoffsetx: tileoffsetx, tileoffsety: tileoffsety
        };
    },
    
    CLASS_NAME: "OpenLayers.Layer.MapGuide"
});
