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
    
    /**
     * @constructor
     * 
     * @param {DOMElement} element
     * @param {String} base
     */
    initialize: function(element, base) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.element = element;        
        if (base) this.base = base;
    },

    /**
     * @type DOMElement
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        var args = OpenLayers.Util.getArgs();
        if (args.lat && args.lon) {
            if (this.map.baseLayer) { 
                this.map.setCenter(
                   new OpenLayers.LonLat(parseFloat(args.lon), parseFloat(args.lat))
                );
            } else {
                this.centerData = new OpenLayers.LonLat(
                                      parseFloat(args.lon),
                                      parseFloat(args.lat));
                this.map.events.register( 'changebaselayer', this, this.setCenter);
            }
        }
        if (args.zoom) {
            if (this.map.baseLayer) { 
                this.map.zoomTo(parseInt(args.zoom));
            } else {
                this.zoomData = parseInt(args.zoom);
            }
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
        this.map.events.register( 'moveend', this, this.updateLink);
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
        var first = true;
        for(var i=0; i< this.map.layers.length; i++) {
            var layer = this.map.layers[i];
            if (layer.getVisibility()) {
                if (!first) {
                    layers += ",";
                }
                layers += i;
                first = false;
            }
        }
        var href = this.base + "?" + lat + "&" + lon + "&" + 
                                     zoom + "&" + layers; 
        this.element.href = href;
    }, 

    setCenter: function() {
        if (this.map.baseLayer && this.centerData) { 
            this.map.setCenter(this.centerData, this.zoomData ? this.zoomData : null);
            this.centerData = null;
        }
    },
            
        
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Permalink"
});

