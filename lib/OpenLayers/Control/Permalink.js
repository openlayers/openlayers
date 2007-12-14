/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 *
 * Class: OpenLayers.Control.Permalink
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Permalink = OpenLayers.Class(OpenLayers.Control, {

    /** 
     * Property: element 
     * {DOMElement}
     */
    element: null,
    
    /** 
     * APIProperty: base
     * {String}
     */
    base: '',

    /**
     * Constructor: OpenLayers.Control.Permalink
     *
     * Parameters: 
     * element - {DOMElement} 
     * base - {String} 
     * options - {Object} options to the control. 
     */
    initialize: function(element, base, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.element = OpenLayers.Util.getElement(element);        
        this.base = base || document.location.href;
    },

    /**
     * APIMethod: destroy
     */
    destroy: function()  {
        if (this.element.parentNode == this.div) {
            this.div.removeChild(this.element);
        }
        this.element = null;

        this.map.events.unregister('moveend', this, this.updateLink);

        OpenLayers.Control.prototype.destroy.apply(this, arguments); 
    },

    /**
     * Method: setMap
     * Set the map property for the control. 
     * 
     * Parameters:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);

        //make sure we have an arg parser attached
        for(var i=0; i< this.map.controls.length; i++) {
            var control = this.map.controls[i];
            if (control.CLASS_NAME == "OpenLayers.Control.ArgParser") {
                break;
            }
        }
        if (i == this.map.controls.length) {
            this.map.addControl(new OpenLayers.Control.ArgParser());       
        }

    },

    /**
     * Method: draw
     *
     * Returns:
     * {DOMElement}
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
          
        if (!this.element) {
            this.div.className = this.displayClass;
            this.element = document.createElement("a");
            this.element.innerHTML = "Permalink";
            this.element.href="";
            this.div.appendChild(this.element);
        }
        this.map.events.register('moveend', this, this.updateLink);
        this.map.events.register('changelayer', this, this.updateLink);
        this.map.events.register('changebaselayer', this, this.updateLink);
        return this.div;
    },
   
    /**
     * Method: updateLink 
     */
    updateLink: function() {
        var center = this.map.getCenter();
        
        // Map not initialized yet. Break out of this function.
        if (!center) { 
            return; 
        }

        var params = OpenLayers.Util.getParameters(this.base);
        
        params.zoom = this.map.getZoom(); 
        params.lat = Math.round(center.lat*100000)/100000;
        params.lon = Math.round(center.lon*100000)/100000;

        params.layers = '';
        for(var i=0; i< this.map.layers.length; i++) {
            var layer = this.map.layers[i];

            if (layer.isBaseLayer) {
                params.layers += (layer == this.map.baseLayer) ? "B" : "0";
            } else {
                params.layers += (layer.getVisibility()) ? "T" : "F";           
            }
        }

        var href = this.base;
        if( href.indexOf('?') != -1 ){
            href = href.substring( 0, href.indexOf('?') );
        }

        href += '?' + OpenLayers.Util.getParameterString(params);
        this.element.href = href;
    }, 

    CLASS_NAME: "OpenLayers.Control.Permalink"
});
