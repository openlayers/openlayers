/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol.js
 */

/**
 * Class: OpenLayers.Protocol.SQL
 * Abstract SQL protocol class.  Not to be instantiated directly.  Use
 *     one of the SQL protocol subclasses instead.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
OpenLayers.Protocol.SQL = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * APIProperty: databaseName
     * {String}
     */
    databaseName: 'ol',

    /**
     * APIProperty: tableName
     * Name of the database table into which Features should be saved.
     */
    tableName: "ol_vector_features",

    /**
     * Property: postReadFiltering
     * {Boolean} Whether the filter (if there's one) must be applied after
     *      the features have been read from the database; for example the
     *      BBOX strategy passes the read method a BBOX spatial filter, if
     *      postReadFiltering is true every feature read from the database
     *      will go through the BBOX spatial filter, which can be costly;
     *      defaults to true.
     */
    postReadFiltering: true,

    /**
     * Constructor: OpenLayers.Protocol.SQL
     */
    initialize: function(options) {
        OpenLayers.Protocol.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        OpenLayers.Protocol.prototype.destroy.apply(this);
    },

    /**
     * APIMethod: supported
     * This should be overridden by specific subclasses
     *
     * Returns:
     * {Boolean} Whether or not the browser supports the SQL backend
     */
    supported: function() {
        return false;
    },

    /**
     * Method: evaluateFilter
     * If postReadFiltering is true evaluate the filter against the feature
     * and return the result of the evaluation, otherwise return true.
     *
     * Parameters:
     * {<OpenLayers.Feature.Vector>} The feature.
     * {<OpenLayers.Filter>} The filter.
     *
     * Returns:
     * {Boolean} true if postReadFiltering if false, the result of the
     * filter evaluation otherwise.
     */
    evaluateFilter: function(feature, filter) {
        return filter && this.postReadFiltering ?
            filter.evaluate(feature) : true;
    },

    CLASS_NAME: "OpenLayers.Protocol.SQL"
});
