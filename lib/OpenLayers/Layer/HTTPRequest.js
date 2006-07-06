/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
// @require: OpenLayers/Layer.js
// @require: OpenLayers/Util.js

/**
 * @class
 */
OpenLayers.Layer.HTTPRequest = Class.create();
OpenLayers.Layer.HTTPRequest.prototype = 
  Object.extend( new OpenLayers.Layer(), {

    /** @type String */
    url: null,

    /** @type Hash */
    params: null,

    /**
     * @constructor
     * 
     * @param {str} name
     * @param {str} url
     * @param {hash} params
     * @param {Object} options Hash of extra options to tag onto the layer
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
        
        //set any non-init vars here
        
        //get all additions from superclasses
        return OpenLayers.Layer.prototype.clone.apply(this, [obj]);
    },

    /** 
     * @param {String} newUrl
     */
    setUrl: function(newUrl) {
        this.url = newUrl;
    },

    
    /**  Deprecated wrapper for mergeNewParams() just so as to not break 
     *    anyone's code who might be using this
     * 
     * @deprecated
     * @param {Object} newParams
     */
    changeParams:function(newParams) {
        this.mergeNewParams(newParams);
    },

    /**
     * @param {Object} newParams
     */
    mergeNewParams:function(newParams) {
        this.params = Object.extend(this.params, newParams);
    },
    

    /** combine the layer's url with its params and these newParams. 
     *   
     *    does checking on the serverPath variable, allowing for cases when it 
     *     is supplied with trailing ? or &, as well as cases where not. 
     *
     *    return in formatted string like this:
     *        "server?key1=value1&key2=value2&key3=value3"
     * 
     * @param {Object} newParams
     * 
     * @type String
     */
    getFullRequestString:function(newParams) {
        
        //requestString always starts with url
        var requestString = this.url;        

        // create a new params hash with all the layer params and the 
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

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.HTTPRequest"
});
