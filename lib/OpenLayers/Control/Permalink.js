/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */

/**
 * @class
 * 
 * @requires OpenLayers/Control.js
 */
OpenLayers.Control.Permalink = OpenLayers.Class.create();
OpenLayers.Control.Permalink.prototype = 
  OpenLayers.Util.extend( new OpenLayers.Control(), {

    /** @type DOMElement */
    element: null,
    
    /** @type String */
    base: '',
    
    /** @type OpenLayers.LonLat */
    center: null,
    
    /** @type int */
    zoom: null,

    /** @type Array */
    layers: null,

    /**
     * @constructor
     * 
     * @param {DOMElement} element
     * @param {String} base
     */
    initialize: function(element, base) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.element = element;        
        if (base) {
            this.base = base;
        }
    },

    /**
     * @type DOMElement
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        var args = OpenLayers.Util.getArgs();

        if (args.lat && args.lon) {
            this.center = new OpenLayers.LonLat(parseFloat(args.lon),
                                                parseFloat(args.lat));
            if (args.zoom) {
                this.zoom = parseInt(args.zoom);
            }

            // when we add a new baselayer to see when we can set the center
            this.map.events.register('changebaselayer', this, this.setCenter);
            this.setCenter();
        }

        if (args.layers) {
            this.layers = args.layers;

            // when we add a new layer, set its visibility 
            this.map.events.register('addlayer', this, this.configureLayers);
            this.configureLayers();
        }
        
        if (!this.element) {
            this.element = document.createElement("a");
            this.div.style.right = "3px";
            this.div.style.bottom = "3px";
            this.div.style.left = "";
            this.div.style.top = "";
            this.div.style.display = "block";
            this.div.style.position = "absolute";
            this.element.style.fontSize="smaller";
            this.element.innerHTML = "Permalink";
            this.element.href="";
            this.div.appendChild(this.element);
        }
        this.map.events.register('moveend', this, this.updateLink);
        return this.div;
    },
   
    /**
     * 
     */
    updateLink: function() {
        var center = this.map.getCenter();
        var zoom = "zoom=" + this.map.getZoom(); 
        var lat = "lat=" + Math.round(center.lat*100000)/100000;
        var lon = "lon=" + Math.round(center.lon*100000)/100000;

        var layers = "layers=";
        for(var i=0; i< this.map.layers.length; i++) {
            var layer = this.map.layers[i];

            if (layer.isBaseLayer) {
                layers += (layer == this.map.baseLayer) ? "B" : "0";
            } else {
                layers += (layer.getVisibility()) ? "T" : "F";           
            }
        }
        var href = this.base + "?" + lat + "&" + lon + "&" + zoom + 
                                   "&" + layers; 
        this.element.href = href;
    }, 

    /** As soon as a baseLayer has been loaded, we center and zoom
     *   ...and remove the handler.
     */
    setCenter: function() {
        
        if (this.map.baseLayer) {
            //dont need to listen for this one anymore
            this.map.events.unregister('changebaselayer', this, 
                                       this.setCenter);
                                       
            this.map.setCenter(this.center, this.zoom);
        }
    },

    /** As soon as all the layers are loaded, cycle through them and 
     *   hide or show them. 
     */
    configureLayers: function() {

        if (this.layers.length == this.map.layers.length) { 
            this.map.events.unregister('addlayer', this, this.configureLayers);

            for(var i=0; i < this.layers.length; i++) {
                
                var layer = this.map.layers[i];
                var c = this.layers.charAt(i);
                
                if (c == "B") {
                    this.map.setBaseLayer(layer);
                } else if ( (c == "T") || (c == "F") ) {
                    layer.setVisibility(c == "T");
                }
            }
        }
    },     
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Permalink"
});
