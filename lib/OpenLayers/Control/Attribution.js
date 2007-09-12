/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Control.js
 * 
 * Class: OpenLayers.Control.Attribution
 * Add attribution from layers to the map display. Uses 'attribution' property
 * of each layer.
 */
OpenLayers.Control.Attribution = 
  OpenLayers.Class(OpenLayers.Control, {
    
    /**
     * APIProperty: seperator
     * {String} String used to seperate layers.
     */
    separator: ", ",
       
    /**
     * Constructor: OpenLayers.Control.Attribution 
     * 
     * Parameters:
     * options - {Object} Options for control.
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
    },

    /** 
     * Method: destroy
     * Destroy control.
     */
    destroy: function() {
        this.map.events.unregister("removelayer", this, this.updateAttribution);
        this.map.events.unregister("addlayer", this, this.updateAttribution);
        this.map.events.unregister("changelayer", this, this.updateAttribution);
        this.map.events.unregister("changebaselayer", this, this.updateAttribution);
        
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },    
    
    /**
     * Method: draw
     * Initialize control.
     * 
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */    
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        
        this.map.events.register('changebaselayer', this, this.updateAttribution);
        this.map.events.register('changelayer', this, this.updateAttribution);
        this.map.events.register('addlayer', this, this.updateAttribution);
        this.map.events.register('removelayer', this, this.updateAttribution);
        this.updateAttribution();
        
        return this.div;    
    },

    /**
     * Method: updateAttribution
     * Update attribution string.
     */
    updateAttribution: function() {
        var attributions = [];
        for(var i=0; i < this.map.layers.length; i++) {
            var layer = this.map.layers[i];
            if (layer.attribution && layer.getVisibility()) {
                attributions.push( layer.attribution );
            }
        }  
        this.div.innerHTML = attributions.join(this.separator);
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Control.Attribution"
});
