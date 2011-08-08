/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 */

/**
 * Class: OpenLayers.Format.XLS
 * Read/Wite XLS (OpenLS). Create a new instance with the <OpenLayers.Format.XLS>
 *     constructor. Currently only implemented for Location Utility Services, more
 *     specifically only for Geocoding. No support for Reverse Geocoding as yet.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.XLS = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.0".
     */
    defaultVersion: "1.1.0",
 
    /**
     * APIProperty: stringifyOutput
     * {Boolean} If true, write will return a string otherwise a DOMElement.
     * Default is true.
     */
    stringifyOutput: true,
    
    /**
     * Constructor: OpenLayers.Format.XLS
     * Create a new parser for XLS.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: write
     * Write out an XLS request.
     *
     * Parameters:
     * request - {Object} An object representing the LUS request.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} An XLS document string.
     */
    
    /**
     * APIMethod: read
     * Read an XLS doc and return an object representing the result.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the GeocodeResponse.
     */

    CLASS_NAME: "OpenLayers.Format.XLS" 
});
