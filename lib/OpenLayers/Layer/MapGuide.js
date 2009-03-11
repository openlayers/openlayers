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
     * APIProperty: useHttpTile
     * {Boolean} use a tile cache exposed directly via a webserver rather than the 
	   *    via mapguide server. This does require extra configuration on the Mapguide Server,
	   *    and will only work when singleTile is false. The url for the layer must be set to the
	   *    webserver path rather than the Mapguide mapagent.	  
	   *    See http://trac.osgeo.org/mapguide/wiki/CodeSamples/Tiles/ServingTilesViaHttp 
     **/
    useHttpTile: false,
    
    /** 
     * APIProperty: singleTile
     * {Boolean} use tile server or request single tile image. 
     **/
    singleTile: false,
    
    /** 
     * APIProperty: useOverlay
     * {Boolean} flag to indicate if the layer should be retrieved using
     * GETMAPIMAGE (default) or using GETDYNAMICOVERLAY requests.
     **/
    useOverlay: false,
    
    /** 
     * APIProperty: useAsyncOverlay
     * {Boolean} indicates if the MapGuide site supports the asynchronous 
     * GETDYNAMICOVERLAY requests which is available in MapGuide Enterprise 2010
     * and MapGuide Open Source v2.0.3 or higher. The newer versions of MG 
     * is called asynchronously, allows selections to be drawn separately from 
     * the map and offers styling options.
     * 
     * With older versions of MapGuide, set useAsyncOverlay=false.  Note that in
     * this case a synchronous AJAX call is issued and the mapname and session
     * parameters must be used to initialize the layer, not the mapdefinition
     * parameter. Also note that this will issue a synchronous AJAX request 
     * before the image request can be issued so the users browser may lock
     * up if the MG Web tier does not respond in a timely fashion.
     **/
    useAsyncOverlay: true,
    
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
     * Constant: OVERLAY_PARAMS
     * {Object} Hashtable of default parameter key/value pairs for untiled layer
     */
    OVERLAY_PARAMS: {
        operation: 'GETDYNAMICMAPOVERLAYIMAGE',
        format: 'PNG',
        locale: 'en',
        clip: '1',
        version: '2.0.0'
    },
    
    /** 
     * Constant: FOLDER_PARAMS
     * {Object} Hashtable of parameter key/value pairs which describe 
     * the folder structure for tiles as configured in the mapguide 
     * serverconfig.ini section [TileServiceProperties]
     */
    FOLDER_PARAMS: {
        tileColumnsPerFolder: 30,
        tileRowsPerFolder: 30,
        format: 'png',
        querystring: null
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
     * For older versions of MapGuide and overlay layers, set useAsyncOverlay 
     * to false and in this case mapName and session are required parameters 
     * for the constructor.
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

        if (options && options.useOverlay!=null) {
          this.useOverlay = options.useOverlay;
        }
        
        //initialize for untiled layers
        if (this.singleTile) {
          if (this.useOverlay) {
            OpenLayers.Util.applyDefaults(
                           this.params,
                           this.OVERLAY_PARAMS
                           );
            if (!this.useAsyncOverlay) {
              this.params.version = "1.0.0";
            }
          } else {
            OpenLayers.Util.applyDefaults(
                           this.params,
                           this.SINGLE_TILE_PARAMS
                           );
          }         
        } else {
            //initialize for tiled layers
            if (this.useHttpTile) {
                OpenLayers.Util.applyDefaults(
                               this.params,
                               this.FOLDER_PARAMS
                               );
            } else {
                OpenLayers.Util.applyDefaults(
                               this.params,
                               this.TILE_PARAMS
                               );
            }
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
          //set up the call for GETMAPIMAGE or GETDYNAMICMAPOVERLAY with
          //dynamic map parameters
          var params = {
            setdisplaydpi: OpenLayers.DOTS_PER_INCH,
            setdisplayheight: mapSize.h*this.ratio,
            setdisplaywidth: mapSize.w*this.ratio,
            setviewcenterx: center.lon,
            setviewcentery: center.lat,
            setviewscale: this.map.getScale()
          };
          
          if (this.useOverlay && !this.useAsyncOverlay) {
            //first we need to call GETVISIBLEMAPEXTENT to set the extent
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

          if (this.useHttpTile){
	          url = this.getImageFilePath(
                   {
                       tilecol: colidx,
                       tilerow: rowidx,
                       scaleindex: this.resolutions.length - this.map.zoom - 1
                    });
		  
          } else {
            url = this.getFullRequestString(
                   {
                       tilecol: colidx,
                       tilerow: rowidx,
                       scaleindex: this.resolutions.length - this.map.zoom - 1
                    });
          }
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
     * Method: getImageFilePath
     * special handler to request mapguide tiles from an http exposed tilecache 
     *
     * Parameters:
     * altUrl - {String} Alternative base URL to use.
     *
     * Returns:
     * {String} A string with the url for the tile image
     */
    getImageFilePath:function(newParams, altUrl) {
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

        var tileRowGroup = "";
        var tileColGroup = "";
        
        if (newParams.tilerow < 0) {
          tileRowGroup =  '-';
        }
          
        if (newParams.tilerow == 0 ) {
          tileRowGroup += '0';
        } else {
          tileRowGroup += Math.floor(Math.abs(newParams.tilerow/this.params.tileRowsPerFolder)) * this.params.tileRowsPerFolder;
        }
          
        if (newParams.tilecol < 0) {
          tileColGroup =  '-';
        }
        
        if (newParams.tilecol == 0) {
          tileColGroup += '0';
        } else {
          tileColGroup += Math.floor(Math.abs(newParams.tilecol/this.params.tileColumnsPerFolder)) * this.params.tileColumnsPerFolder;
        }					
        
        var tilePath = '/S' + Math.floor(newParams.scaleindex)
                + '/' + this.params.basemaplayergroupname
                + '/R' + tileRowGroup
                + '/C' + tileColGroup
                + '/' + (newParams.tilerow % this.params.tileRowsPerFolder) 
                + '_' + (newParams.tilecol % this.params.tileColumnsPerFolder) 
                + '.' + this.params.format;
    
        if (this.params.querystring) {
               tilePath += "?" + this.params.querystring;
        }
        
        requestString += tilePath;
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
