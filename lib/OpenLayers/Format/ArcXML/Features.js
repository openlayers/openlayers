/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/ArcXML.js
 */

/**
 * Class: OpenLayers.Format.ArcXML.Features
 * Read/Wite ArcXML features. Create a new instance with the 
 *     <OpenLayers.Format.ArcXML.Features> constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.ArcXML.Features = OpenLayers.Class(OpenLayers.Format.XML, {

    /**
     * Constructor: OpenLayers.Format.ArcXML.Features
     * Create a new parser/writer for ArcXML Features.  Create an instance of this class
     * to get a set of features from an ArcXML response.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    
    /**
     * APIMethod: read
     * Read data from a string of ArcXML, and return a set of OpenLayers features. 
     * 
     * Parameters:
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} A collection of features.
     */
    read: function(data) {
        var axl = new OpenLayers.Format.ArcXML();
        var parsed = axl.read(data);
        
        return parsed.features.feature;
    }
});
