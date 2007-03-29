/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */
// @requires OpenLayers/Layer/Grid.js
/**
* @class
 * @requires OpenLayers/Layer/Grid.js
*/
OpenLayers.Layer.MapServer = OpenLayers.Class.create();
OpenLayers.Layer.MapServer.prototype =
  OpenLayers.Class.inherit( OpenLayers.Layer.Grid, {

    /** @final @type hash */
    DEFAULT_PARAMS: {
                      mode: "map",
                      map_imagetype: "png"
                     },

    /**
    * @constructor
    *
    * @param {str} name
    * @param {str} url
    * @param {hash} params
    */
    initialize: function(name, url, params, options) {
        var newArguments = new Array();
        newArguments.push(name, url, params, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (arguments.length > 0) {
            OpenLayers.Util.applyDefaults(
                           this.params,
                           this.DEFAULT_PARAMS
                           );
        }

        // unless explicitly set in options, if the layer is transparent, 
        // it will be an overlay
        if (options == null || options.isBaseLayer == null) {
            this.isBaseLayer = ((this.params.transparent != "true") && 
                                (this.params.transparent != true));
        }
    },

    /**
    * @param {Object} obj
    *
    * @returns A clone of this OpenLayers.Layer.MapServer
    * @type OpenLayers.Layer.MapServer
    */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Layer.MapServer(this.name,
                                           this.url,
                                           this.params,
                                           this.options);
        }
        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },

    /**
    * addTile creates a tile, initializes it (via 'draw' in this case), and
    * adds it to the layer div.
    *
    * @param {OpenLayers.Bounds} bounds
    *
    * @returns The added OpenLayers.Tile.Image
    * @type OpenLayers.Tile.Image
    */
    addTile:function(bounds,position) {
        var url = this.getURL(bounds);
        return new OpenLayers.Tile.Image(this, position, bounds, url, this.tileSize);
    },
    
    /**
     * @param {OpenLayers.Bounds} bounds
     * 
     * @returns A string with the layer's url and parameters and also the 
     *           passed-in bounds and appropriate tile size specified as 
     *           parameters
     * @type String
     */
    getURL: function (bounds) {
        
        // Make a list, so that getFullRequestString uses literal "," 
        var extent = [bounds.left, bounds. bottom, bounds.right, bounds.top];
        
        // make lists, so that literal ','s are used 
        var url = this.getFullRequestString(
                     {mapext:   extent,
                      imgext:   extent,
                      map_size: [this.tileSize.w,this.tileSize.h],
                      imgx:     this.tileSize.w/2,
                      imgy:     this.tileSize.h/2,
                      imgxy:    [this.tileSize.w,this.tileSize.h]
                      });
        
        return url;
    },
    
    /** 
     * getFullRequestString on MapServer layers is special, because we 
     * do a regular expression replace on ',' in parameters to '+'.
     * This is why it is subclassed here.
     *
     * @param {Object} newParams Parameters to add to the default parameters
     *                           for the layer.
     * @param {String} altUrl    Alternative base URL to use.
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
        var allParams = OpenLayers.Util.extend(new Object(), this.params);
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
        
        /* MapServer needs '+' seperating things like bounds/height/width.
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
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.MapServer"
});
