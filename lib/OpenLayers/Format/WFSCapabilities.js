/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 */

/**
 * Class: OpenLayers.Format.WFSCapabilities
 * Read WFS Capabilities.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.WFSCapabilities = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.0".
     */
    defaultVersion: "1.1.0",
 
    /**
     * APIProperty: errorProperty
     * {String} Which property of the returned object to check for in order to
     * determine whether or not parsing has failed. In the case that the
     * errorProperty is undefined on the returned object, the document will be
     * run through an OGCExceptionReport parser.
     */
    errorProperty: "service",

    /**
     * Constructor: OpenLayers.Format.WFSCapabilities
     * Create a new parser for WFS capabilities.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return a list of layers. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array} List of named layers.
     */
    
    CLASS_NAME: "OpenLayers.Format.WFSCapabilities" 

});
