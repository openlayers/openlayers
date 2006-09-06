/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
 
/**
 * @class
 * 
 * @requires OpenLayers/Layer/HTTPRequest.js
 * @requires OpenLayers/Layer/WMS.js
 */
OpenLayers.Layer.WMS.Untiled = Class.create();
OpenLayers.Layer.WMS.Untiled.prototype = 
  Object.extend( new OpenLayers.Layer.HTTPRequest(), {

    /** Hashtable of default parameter key/value pairs
     * @final @type Object */
    DEFAULT_PARAMS: { service: "WMS",
                      version: "1.1.1",
                      request: "GetMap",
                      styles: "",
                      exceptions: "application/vnd.ogc.se_inimage",
                      format: "image/jpeg"
                     },

    /** @type DOMElement */
    imgDiv: null,
    

    /**
    * @constructor
    *
    * @param {String} name
    * @param {String} url
    * @param {Object} params
    */
    initialize: function(name, url, params, options) {
        var newArguments = new Array();
        if (arguments.length > 0) {
            //uppercase params
            params = OpenLayers.Util.upperCaseObject(params);
            newArguments.push(name, url, params, options);
        }
        OpenLayers.Layer.HTTPRequest.prototype.initialize.apply(this, 
                                                                newArguments);
        
        if (arguments.length > 0) {
            OpenLayers.Util.applyDefaults(
                           this.params, 
                           OpenLayers.Util.upperCaseObject(this.DEFAULT_PARAMS)
                           );
        }

        // if the layer is transparent, it will be an overlay        
        this.isBaseLayer = ((this.params.TRANSPARENT != "true") && 
                            (this.params.TRANSPARENT != true));

    },    

    /**
     * 
     */
    destroy: function() {
        this.imgDiv = null;    
        OpenLayers.Layer.HTTPRequest.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * @param {Object} obj
     * 
     * @returns An exact clone of this OpenLayers.Layer.WMS.Untiled
     * @type OpenLayers.Layer.WMS.Untiled
     */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer.WMS.Untiled(this.name,
                                                   this.url,
                                                   this.params,
                                                   this.options);
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.HTTPRequest.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    
    
    
    /** Once HTTPRequest has set the map, we can load the image div
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Layer.HTTPRequest.prototype.setMap.apply(this, arguments);
        this.loadImageDiv();
    },

    /** When it is not a minor move (ie when panning or when done dragging)
     *   reload and recenter the div.
     * 
     * @param {OpenLayers.Bounds} bounds
     * @param {Boolean} zoomChanged
     * @param {Boolean} minor
     */
    moveTo:function(bounds, zoomChanged, minor) {

        if (!minor) {
        
            if (bounds == null) {
                bounds = this.map.getExtent();
            }
            
            var size = this.map.getSize().clone();

            // get the url
            var url = this.getFullRequestString( {BBOX: bounds.toBBOX(),
                                                  WIDTH: size.w,
                                                  HEIGHT: size.h} );
        

            // always position at upper left corner of current viewspace
            var tl = new OpenLayers.Pixel(0,0);
            var pos = this.map.getLayerPxFromViewPortPx(tl);

            // first hide before all modifications            
            Element.hide(this.imgDiv);
            
            // update div
            var img = this.imgDiv;
            if (this.params.TRANSPARENT == 'true') {
                OpenLayers.Util.modifyAlphaImageDiv(this.imgDiv, 
                                                    null, 
                                                    pos, 
                                                    size,
                                                    url);
                img = this.imgDiv.childNodes[0];
            } else {
                OpenLayers.Util.modifyDOMElement(this.imgDiv, 
                                                 null, 
                                                 pos, 
                                                 size);
                this.imgDiv.src = url;
            }
    
            // wait until image is done loading to show again
            Event.observe(img, 
                          "load", 
                          this.showDiv.bindAsEventListener(this));
        }
    },
    
    /** Helper function that allows us to first hide the imgDiv, then make all 
     *   the changes (position, size, url). Then when the url is done loading,
     *   we call this function to show the imgDiv.
     * 
     * @private
     */
    showDiv: function() {
        Element.show(this.imgDiv);
    },
    
    /** Once HTTPRequest has updated the url, reload the image div
     * @param {String} newUrl
     */
    setUrl: function(newUrl) {
        OpenLayers.Layer.HTTPRequest.prototype.setUrl.apply(this, arguments);
        this.moveTo();
    },

    /** Once HTTPRequest has updated new params, reload the image div
     * @param {Object} newParams
     */
    mergeNewParams:function(newParams) {
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        OpenLayers.Layer.HTTPRequest.prototype.mergeNewParams.apply(this, 
                                                                 newArguments);
        //redraw
        this.moveTo();
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
    
    /** This function first removes the previous image div, then adds a new
     *   one according to the transparency property.
     * 
     * @private
     */
    loadImageDiv: function() {
        
        var size = this.map.getSize().clone();
        var bounds = this.map.getExtent();

        var url = "";            
        if (bounds != null) {
            url = this.getFullRequestString( {BBOX: bounds.toBBOX(),
                                              WIDTH: size.w,
                                              HEIGHT: size.h} );
        }
        
        //clear previous wms image (removes imgDiv)
        this.div.innerHTML = "";
        
        //always position at upper left corner of current viewspace
        var tl = new OpenLayers.Pixel(0,0);
        var pos = this.map.getLayerPxFromViewPortPx(tl);
        
        //create div
        if (this.params.TRANSPARENT == 'true') {
            this.imgDiv = OpenLayers.Util.createAlphaImageDiv(null,
                                                              pos,
                                                              size,
                                                              url,
                                                              "absolute");
        } else {
            this.imgDiv = OpenLayers.Util.createImage(null,
                                                      pos,
                                                      size,
                                                      url,
                                                      "absolute");
        }
        
        this.div.appendChild(this.imgDiv);
    },
        
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.WMS.Untiled"
});
