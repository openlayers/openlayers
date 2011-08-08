/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Feature.js
 */

/**
 * Class: OpenLayers.Feature.WFS
 * WFS handling class, for use as a featureClass on the WFS layer for handling
 * 'point' WFS types. Good for subclassing when creating a custom WFS like
 * XML application.
 * 
 * Inherits from:
 *  - <OpenLayers.Feature>
 */
OpenLayers.Feature.WFS = OpenLayers.Class(OpenLayers.Feature, {
      
    /** 
     * Constructor: OpenLayers.Feature.WFS
     * Create a WFS feature.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>} 
     * xmlNode - {XMLNode} 
     */
    initialize: function(layer, xmlNode) {
        var newArguments = arguments;
        var data = this.processXMLNode(xmlNode);
        newArguments = new Array(layer, data.lonlat, data);
        OpenLayers.Feature.prototype.initialize.apply(this, newArguments);
        this.createMarker();
        this.layer.addMarker(this.marker);
    },
    
    /** 
     * Method: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.marker != null) {
            this.layer.removeMarker(this.marker);  
        }
        OpenLayers.Feature.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: processXMLNode
     * When passed an xmlNode, parses it for a GML point, and passes
     * back an object describing that point.
     *
     * For subclasses of Feature.WFS, this is the feature to change.
     *
     * Parameters:
     * xmlNode - {XMLNode} 
     * 
     * Returns:
     * {Object} Data Object with 'id', 'lonlat', and private properties set
     */
    processXMLNode: function(xmlNode) {
        //this should be overridden by subclasses
        // must return an Object with 'id' and 'lonlat' values set
        var point = OpenLayers.Ajax.getElementsByTagNameNS(xmlNode, "http://www.opengis.net/gml", "gml", "Point");
        var text  = OpenLayers.Util.getXmlNodeValue(OpenLayers.Ajax.getElementsByTagNameNS(point[0], "http://www.opengis.net/gml","gml", "coordinates")[0]);
        var floats = text.split(",");
        return {lonlat: new OpenLayers.LonLat(parseFloat(floats[0]),
                                              parseFloat(floats[1])),
                id: null};

    },

    CLASS_NAME: "OpenLayers.Feature.WFS"
});
  
  
  
  

