/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML/VersionedOGC.js
 * @requires OpenLayers/Style.js
 * @requires OpenLayers/Rule.js
 * @requires OpenLayers/Filter/FeatureId.js
 * @requires OpenLayers/Filter/Logical.js
 * @requires OpenLayers/Filter/Comparison.js
 * @requires OpenLayers/Filter/Spatial.js
 */

/**
 * Class: OpenLayers.Format.SLD
 * Read/Wite SLD. Create a new instance with the <OpenLayers.Format.SLD>
 *     constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML.VersionedOGC>
 */
OpenLayers.Format.SLD = OpenLayers.Class(OpenLayers.Format.XML.VersionedOGC, {
    
    /**
     * APIProperty: profile
     * {String} If provided, use a custom profile.
     *
     * Currently supported profiles:
     * - GeoServer - parses GeoServer vendor specific capabilities for SLD.
     */
    profile: null,

    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.0.0".
     */
    defaultVersion: "1.0.0",
    
    /**
     * APIProperty: stringifyOutput
     * {Boolean} If true, write will return a string otherwise a DOMElement.
     * Default is true.
     */
    stringifyOutput: true,
    
    /**
     * APIProperty: namedLayersAsArray
     * {Boolean} Generate a namedLayers array.  If false, the namedLayers
     *     property value will be an object keyed by layer name. Default is
     *     false.
     */
    namedLayersAsArray: false,
    
    /**
     * APIMethod: write
     * Write a SLD document given a list of styles.
     *
     * Parameters:
     * sld - {Object} An object representing the SLD.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} An SLD document string.
     */
    
    /**
     * APIMethod: read
     * Read and SLD doc and return an object representing the SLD.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     * options - {Object} Options for the reader.
     *
     * Returns:
     * {Object} An object representing the SLD.
     */

    CLASS_NAME: "OpenLayers.Format.SLD" 
});
