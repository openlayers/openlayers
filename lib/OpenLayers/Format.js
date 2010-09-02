/* Copyright (c) 2006-2010 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Util.js
 * @requires OpenLayers/Console.js
 */

/**
 * Class: OpenLayers.Format
 * Base class for format reading/writing a variety of formats.  Subclasses
 *     of OpenLayers.Format are expected to have read and write methods.
 */
OpenLayers.Format = OpenLayers.Class({
    
    /**
     * Property: options
     * {Object} A reference to options passed to the constructor.
     */
    options: null,
    
    /**
     * APIProperty: externalProjection
     * {<OpenLayers.Projection>} When passed a externalProjection and
     *     internalProjection, the format will reproject the geometries it
     *     reads or writes. The externalProjection is the projection used by
     *     the content which is passed into read or which comes out of write.
     *     In order to reproject, a projection transformation function for the
     *     specified projections must be available. This support may be 
     *     provided via proj4js or via a custom transformation function. See
     *     {<OpenLayers.Projection.addTransform>} for more information on
     *     custom transformations.
     */
    externalProjection: null,

    /**
     * APIProperty: internalProjection
     * {<OpenLayers.Projection>} When passed a externalProjection and
     *     internalProjection, the format will reproject the geometries it
     *     reads or writes. The internalProjection is the projection used by
     *     the geometries which are returned by read or which are passed into
     *     write.  In order to reproject, a projection transformation function
     *     for the specified projections must be available. This support may be
     *     provided via proj4js or via a custom transformation function. See
     *     {<OpenLayers.Projection.addTransform>} for more information on
     *     custom transformations.
     */
    internalProjection: null,

    /**
     * APIProperty: data
     * {Object} When <keepData> is true, this is the parsed string sent to
     *     <read>.
     */
    data: null,

    /**
     * APIProperty: keepData
     * {Object} Maintain a reference (<data>) to the most recently read data.
     *     Default is false.
     */
    keepData: false,

    /**
     * Constructor: OpenLayers.Format
     * Instances of this class are not useful.  See one of the subclasses.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           format
     *
     * Valid options:
     * keepData - {Boolean} If true, upon <read>, the data property will be
     *     set to the parsed object (e.g. the json or xml object).
     *
     * Returns:
     * An instance of OpenLayers.Format
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
        this.options = options;
    },
    
    /**
     * APIMethod: destroy
     * Clean up.
     */
    destroy: function() {
    },

    /**
     * Method: read
     * Read data from a string, and return an object whose type depends on the
     * subclass. 
     * 
     * Parameters:
     * data - {string} Data to read/parse.
     *
     * Returns:
     * Depends on the subclass
     */
    read: function(data) {
        OpenLayers.Console.userError(OpenLayers.i18n("readNotImplemented"));
    },
    
    /**
     * Method: write
     * Accept an object, and return a string. 
     *
     * Parameters:
     * object - {Object} Object to be serialized
     *
     * Returns:
     * {String} A string representation of the object.
     */
    write: function(object) {
        OpenLayers.Console.userError(OpenLayers.i18n("writeNotImplemented"));
    },

    CLASS_NAME: "OpenLayers.Format"
});     
