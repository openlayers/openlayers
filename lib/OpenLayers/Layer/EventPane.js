/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the full
 * text of the license. */
/**
 * @class
 */
OpenLayers.Layer.EventPane = Class.create();
OpenLayers.Layer.EventPane.prototype = Object.extend(new OpenLayers.Layer, {
    /**
     * @constructor
     * 
     * @param {String} name
     * @param {Object} options Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        if (arguments.length > 0) {

            //store a copy of the custom options for later cloning
            this.options = Object.extend(new Object(), options);
            
            //add options to layer
            Object.extend(this, this.options);

            this.name = name;
            
            //generate unique id based on name
            this.id = OpenLayers.Util.createUniqueID("Layer_");
            
            if (this.div == null) {
                this.div = OpenLayers.Util.createDiv();
                this.div.style.width = "100%";
                this.div.style.height = "100%";
            }
        }
    },
    
   /**
    * @returns An exact clone of this OpenLayers.Layer
    * @type OpenLayers.Layer
    */
    clone: function (obj) {
        
        if (obj == null) {
            obj = new OpenLayers.Layer(this.name, this.options);
        } 
        
        // catch any randomly tagged-on properties
        obj = OpenLayers.Util.applyDefaults(obj, this);
        
        // a cloned layer should never have its map property set
        //  because it has not been added to a map yet. 
        obj.map = null;
        
        return obj;
    },

    /** Set the map property for the layer. This is done through an accessor
     *   so that subclasses can override this and take special action once 
     *   they have their map variable set. 
     * 
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        this.map = map;
        
        var properties = new Array(
          'projection', 'minExtent', 'maxExtent',
          'minScale', 'maxScale',
          'maxResolution', 'minResolution', 
          'minZoomLevel', 'maxZoomLevel', 'units',
          'scales', 'resolutions'
          
        );
        for(var i=0; i < properties.length; i++) {
            if (this[properties[i]] == null) {
                this[properties[i]] = this.map[properties[i]];
            }    
        }
    },
  
    /** 
     * @param {Boolean} visible
     * @param {Boolean} noEvent
     */
    setVisibility: function(visible, noEvent) {
        if (visible != this.getVisibility()) {
            this.div.style.display = (visible) ? "block" : "none";
            if ((visible) && (this.map != null)) {
                var extent = this.map.getExtent();
                if (extent != null) {
                    this.moveTo(this.map.getExtent());
                }
            }
            if ((this.map != null) && 
                ((noEvent == null) || (noEvent == false))) {
                this.map.events.triggerEvent("changelayer");
            }
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Layer.EventPane"
});
