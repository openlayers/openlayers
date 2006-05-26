/**
 * @class
 */
OpenLayers.Feature.WFS = Class.create();
OpenLayers.Feature.WFS.prototype = 
  Object.extend( new OpenLayers.Feature(), {
      
    /** 
     * @constructor
     * 
     * @param {OpenLayers.Layer} layer
     * @param {XMLNode} xmlNode
     */
    initialize: function(layer, xmlNode) {
        var newArguments = arguments;
        if (arguments.length > 0) {
            var data = this.processXMLNode(xmlNode);
            newArguments = new Array(layer, data.id, data.lonlat, data)
        }
        OpenLayers.Feature.prototype.initialize.apply(this, newArguments);
        
        if (arguments.length > 0) {
            this.createMarker();
            this.layer.addMarker(this.marker);
        }
    },

    /**
     * @param {XMLNode} xmlNode
     * 
     * @returns Data Object with 'id', 'lonlat', and private properties set
     * @type Object
     */
    processXMLNode: function(xmlNode) {
        //this should be overridden by subclasses

        // must return an Object with 'id' and 'lonlat' values set
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Feature.WFS"
});
  
  
  
  

