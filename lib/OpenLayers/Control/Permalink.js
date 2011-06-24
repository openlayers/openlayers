/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */


/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Control/ArgParser.js
 * @requires OpenLayers/Lang.js
 */

/**
 * Class: OpenLayers.Control.Permalink
 * The Permalink control is hyperlink that will return the user to the 
 * current map view. By default it is drawn in the lower right corner of the
 * map. The href is updated as the map is zoomed, panned and whilst layers
 * are switched.
 * `
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.Permalink = OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * APIProperty: argParserClass
     * {Class} The ArgParser control class (not instance) to use with this
     *     control.
     */
    argParserClass: OpenLayers.Control.ArgParser,

    /** 
     * Property: element 
     * {DOMElement}
     */
    element: null,
    
    /** 
     * APIProperty: anchor
     * {Boolean} This option changes 3 things:
     *     the character '#' is used in place of the character '?',
     *     the window.href is updated if no element is provided.
     *     When this option is set to true it's not recommend to provide
     *     a base without provide an element.
     */
    anchor: false,

    /** 
     * APIProperty: base
     * {String}
     */
    base: '',

    /** 
     * APIProperty: displayProjection
     * {<OpenLayers.Projection>} Requires proj4js support.  Projection used
     *     when creating the coordinates in the link. This will reproject the
     *     map coordinates into display coordinates. If you are using this
     *     functionality, the permalink which is last added to the map will
     *     determine the coordinate type which is read from the URL, which
     *     means you should not add permalinks with different
     *     displayProjections to the same map. 
     */
    displayProjection: null, 

    /**
     * Constructor: OpenLayers.Control.Permalink
     *
     * Parameters: 
     * element - {DOMElement} 
     * base - {String} 
     * options - {Object} options to the control.
     *
     * Or for anchor:
     * options - {Object} options to the control.
     */
    initialize: function(element, base, options) {
        if (element !== null && typeof element == 'object' && !OpenLayers.Util.isElement(element)) {
            options = element;
            this.base = document.location.href;
            OpenLayers.Control.prototype.initialize.apply(this, [options]);
            if (this.element != null) {
                this.element = OpenLayers.Util.getElement(this.element);
            }
        }
        else {
            OpenLayers.Control.prototype.initialize.apply(this, [options]);
            this.element = OpenLayers.Util.getElement(element);
            this.base = base || document.location.href;
        }
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
        for(var i=0, len=this.map.controls.length; i<len; i++) {
            var control = this.map.controls[i];
            if (control.CLASS_NAME == this.argParserClass.CLASS_NAME) {
                
                // If a permalink is added to the map, and an ArgParser already
                // exists, we override the displayProjection to be the one
                // on the permalink. 
                if (control.displayProjection != this.displayProjection) {
                    this.displayProjection = control.displayProjection;
                }    
                
                break;
            }
        }
        if (i == this.map.controls.length) {
            this.map.addControl(new this.argParserClass(
                { 'displayProjection': this.displayProjection }));       
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
          
        if (!this.element && !this.anchor) {
            this.element = document.createElement("a");
            this.element.innerHTML = OpenLayers.i18n("Permalink");
            this.element.href="";
            this.div.appendChild(this.element);
        }
        this.map.events.on({
            'moveend': this.updateLink,
            'changelayer': this.updateLink,
            'changebaselayer': this.updateLink,
            scope: this
        });
        
        // Make it so there is at least a link even though the map may not have
        // moved yet.
        this.updateLink();
        
        return this.div;
    },
   
    /**
     * Method: updateLink 
     */
    updateLink: function() {
        var separator = this.anchor ? '#' : '?';
        var href = this.base;
        if (href.indexOf(separator) != -1) {
            href = href.substring( 0, href.indexOf(separator) );
        }

        href += separator + OpenLayers.Util.getParameterString(this.createParams());
        if (this.anchor && !this.element) {
            window.location.href = href;
        }
        else {
            this.element.href = href;
        }
    }, 
    
    /**
     * APIMethod: createParams
     * Creates the parameters that need to be encoded into the permalink url.
     * 
     * Parameters:
     * center - {<OpenLayers.LonLat>} center to encode in the permalink.
     *     Defaults to the current map center.
     * zoom - {Integer} zoom level to encode in the permalink. Defaults to the
     *     current map zoom level.
     * layers - {Array(<OpenLayers.Layer>)} layers to encode in the permalink.
     *     Defaults to the current map layers.
     * 
     * Returns:
     * {Object} Hash of parameters that will be url-encoded into the
     * permalink.
     */
    createParams: function(center, zoom, layers) {
        center = center || this.map.getCenter();
          
        var params = OpenLayers.Util.getParameters(this.base);
        
        // If there's still no center, map is not initialized yet. 
        // Break out of this function, and simply return the params from the
        // base link.
        if (center) { 

            //zoom
            params.zoom = zoom || this.map.getZoom(); 

            //lon,lat
            var lat = center.lat;
            var lon = center.lon;
            
            if (this.displayProjection) {
                var mapPosition = OpenLayers.Projection.transform(
                  { x: lon, y: lat }, 
                  this.map.getProjectionObject(), 
                  this.displayProjection );
                lon = mapPosition.x;  
                lat = mapPosition.y;  
            }       
            params.lat = Math.round(lat*100000)/100000;
            params.lon = Math.round(lon*100000)/100000;
    
            //layers        
            layers = layers || this.map.layers;  
            params.layers = '';
            for (var i=0, len=layers.length; i<len; i++) {
                var layer = layers[i];
    
                if (layer.isBaseLayer) {
                    params.layers += (layer == this.map.baseLayer) ? "B" : "0";
                } else {
                    params.layers += (layer.getVisibility()) ? "T" : "F";           
                }
            }
        }

        return params;
    }, 

    CLASS_NAME: "OpenLayers.Control.Permalink"
});
