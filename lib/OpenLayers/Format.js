/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Base class for format reading/writing. 
 * @requires OpenLayers/Util.js
 */
OpenLayers.Format = OpenLayers.Class.create();
OpenLayers.Format.prototype = {
    
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Read data from a string, and return a list of features. 
     * 
     * @param {string} data data to read/parse.
     */
     read: function(data) {
         alert("Read not implemented.");
     },
    
    /**
     * Accept Feature Collection, and return a string. 
     * 
     * @param {Array} List of features to serialize into a string.
     */
     write: function(features) {
         alert("Write not implemented.");
     }
};     
