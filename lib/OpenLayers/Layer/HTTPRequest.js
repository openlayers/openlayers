/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Layer.js
 */
OpenLayers.Layer.HTTPRequest = Class.create();
OpenLayers.Layer.HTTPRequest.prototype = 
  Object.extend( new OpenLayers.Layer(), {

    /** @type String */
    url: null,

    /** Hashtable of key/value parameters
     * @type Object */
    params: null,

    /**
     * @constructor
     * 
     * @param {String} name
     * @param {String} url
     * @param {Object} params
     * @param {Object} options Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, params, options) {
        var newArguments = arguments;
        if (arguments.length > 0) {
            newArguments = [name, options];
        }          
        OpenLayers.Layer.prototype.initialize.apply(this, newArguments);
        this.url = url;
        this.params = Object.extend( new Object(), params);
    },

    /** When the layer is added to the map, once it has taken all the 
     *   relevant properties from the map (in Layer.setMap()), we will
     *   make the call to initialize the layer's resolutions array.
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.prototype.setMap.apply(this, arguments);
        this.initResolutions();
    },
    
    /**
     * 
     */
    destroy: function() {
        this.url = null;
        this.params = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments); 
    },
    
    /**
     * @param {Object} obj
     * 
     * @returns An exact clone of this OpenLayers.Layer.HTTPRequest
     * @type OpenLayers.Layer.HTTPRequest
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.HTTPRequest(this.name,
                                                   this.url,
                                                   this.params,
                                                   this.options);
        }
        
        //get all additions from superclasses
        obj = OpenLayers.Layer.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here
        
        return obj;
    },

    /** 
     * @param {String} newUrl
     */
    setUrl: function(newUrl) {
        this.url = newUrl;
    },

    /**
     * @param {Object} newParams
     */
    mergeNewParams:function(newParams) {
        this.params = Object.extend(this.params, newParams);
    },
    

    /** combine url with layer's params and these newParams. 
     *   
     *    does checking on the serverPath variable, allowing for cases when it 
     *     is supplied with trailing ? or &, as well as cases where not. 
     *
     *    return in formatted string like this:
     *        "server?key1=value1&key2=value2&key3=value3"
     * 
     * @param {Object} newParams
     * @param {String} altUrl Use this as the url instead of the layer's url
     * 
     * @type String
     */
    getFullRequestString:function(newParams, altUrl) {
        
        // use layer's url unless altUrl passed in
        var url = (altUrl == null) ? this.url : altUrl;
        
        // requestString always starts with url
        var requestString = url;        

        // create a new params hashtable with all the layer params and the 
        // new params together. then convert to string
        var allParams = Object.extend(new Object(), this.params);
        var allParams = Object.extend(allParams, newParams);
        var paramsString = OpenLayers.Util.getParameterString(allParams);

        if (paramsString != "") {
            var lastServerChar = this.url.charAt(this.url.length - 1);
            if ((lastServerChar == "&") || (lastServerChar == "?")) {
                requestString += paramsString;
            } else {
                if (this.url.indexOf('?') == -1) {
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
    
    /** This method's responsibility is to set up the 'resolutions' array 
     *   for the layer -- this array is what the layer will use to interface
     *   between the zoom levels of the map and the resolution display of the
     *   layer.
     * 
     *  The user has several options that determine how the array is set up.
     *  
     *  For a detailed explanation, see the following wiki from the 
     *   openlayers.org homepage:
     * 
     *  http://trac.openlayers.org/wiki/SettingZoomLevels
     * 
     * @private
     */
    initResolutions: function() {
        
        if ((this.scales != null) || (this.resolutions != null)) {
          //preset levels
            if (this.scales != null) {
                this.resolutions = new Array();
                for(var i = 0; i < this.scales.length; i++) {
                    this.resolutions[i] = 
                       OpenLayers.Util.getResolutionFromScale(this.scales[i], 
                                                              this.units);
                }
            }
            this.numZoomLevels = this.resolutions.length;

        } else {
          //maxResolution and numZoomLevels
            
            this.resolutions = new Array();
            
            // determine maxResolution
            if (this.minScale) {
                this.maxResolution = 
                    OpenLayers.Util.getResolutionFromScale(this.minScale, 
                                                           this.units);
            } else if (this.maxResolution == "auto") {
                var viewSize = this.map.getSize();
                var wRes = this.maxExtent.getWidth() / viewSize.w;
                var hRes = this.maxExtent.getHeight()/ viewSize.h;
                this.maxResolution = Math.max(wRes, hRes);
            } 

            // determine minResolution
            if (this.maxScale != null) {           
                this.minResolution = 
                    OpenLayers.Util.getResolutionFromScale(this.maxScale);
            } else if ((this.minResolution == "auto") && 
                       (this.minExtent != null)){
                var viewSize = this.map.getSize();
                var wRes = this.minExtent.getWidth() / viewSize.w;
                var hRes = this.minExtent.getHeight()/ viewSize.h;
                this.minResolution = Math.max(wRes, hRes);
            } 

            // determine numZoomLevels
            if (this.minResolution != null) {
                var ratio = this.maxResolution / this.minResolution;
                this.numZoomLevels = 
                    Math.floor(Math.log(ratio) / Math.log(2)) + 1;
            }
            
            // now we have numZoomLevels and maxResolution, 
            //  we can populate the resolutions array
            for (var i=0; i < this.numZoomLevels; i++) {
                this.resolutions.push(this.maxResolution / Math.pow(2, i));
            }    
        }
    },
    
    /**
     * @returns The currently selected resolution of the map, taken from the
     *          resolutions array, indexed by current zoom level.
     * @type float
     */
    getResolution: function() {
        var zoom = this.map.getZoom();

        return this.resolutions[zoom];
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.HTTPRequest"
});
