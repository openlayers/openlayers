/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Util.js
 * 
 * Class: OpenLayers.Format
 * Base class for format reading/writing a variety of formats.  Subclasses
 * of OpenLayers.Format are expected to have read and write methods.
 */
OpenLayers.Format = OpenLayers.Class({
    
    /**
     * Constructor: OpenLayers.Format
     * Instances of this class are not useful.  See one of the subclasses.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           format
     *
     * Return:
     * An instance of OpenLayers.Format
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Method: read
     * Read data from a string, and return an object whose type depends on the
     * subclass. 
     * 
     * Parameters:
     * data - {string} Data to read/parse.
     *
     * Return:
     * Depends on the subclass
     */
    read: function(data) {
        alert("Read not implemented.");
    },
    
    /**
     * Method: write
     * Accept an object, and return a string. 
     *
     * Parameters:
     * object - {Object} Object to be serialized
     *
     * Return:
     * {String} A string representation of the object.
     */
    write: function(object) {
        alert("Write not implemented.");
    },

    CLASS_NAME: "OpenLayers.Format"
});     
