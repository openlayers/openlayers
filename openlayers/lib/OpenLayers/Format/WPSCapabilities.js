/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 */
 
/**
 * Class: OpenLayers.Format.WPSCapabilities
 * Read WPS Capabilities.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.WPSCapabilities = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.0.0".
     */
    defaultVersion: "1.0.0",
    
    /**
     * Constructor: OpenLayers.Format.WPSCapabilities
     * Create a new parser for WPS Capabilities.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return information about
     * the service.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Info about the WPS
     */
    
    CLASS_NAME: "OpenLayers.Format.WPSCapabilities" 

});
