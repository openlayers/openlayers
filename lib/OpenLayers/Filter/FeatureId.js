/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */


/**
 * @requires OpenLayers/Filter.js
 */

/**
 * Class: OpenLayers.Filter.FeatureId
 * This class represents a ogc:FeatureId Filter, as being used for rule-based SLD
 * styling
 * 
 * Inherits from
 * - <OpenLayers.Filter>
 */
OpenLayers.Filter.FeatureId = OpenLayers.Class(OpenLayers.Filter, {

    /** 
     * APIProperty: fids
     * {Array(String)} Feature Ids to evaluate this rule against. To be passed
     * To be passed inside the params object.
     */
    fids: null,
    
    /** 
     * Constructor: OpenLayers.Filter.FeatureId
     * Creates an ogc:FeatureId rule.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           rule
     * 
     * Returns:
     * {<OpenLayers.Filter.FeatureId>}
     */
    initialize: function(options) {
        this.fids = [];
        OpenLayers.Filter.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: evaluate
     * evaluates this rule for a specific feature
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature>} feature to apply the rule to.
     *           For vector features, the check is run against the fid,
     *           for plain features against the id.
     * 
     * Returns:
     * {Boolean} true if the rule applies, false if it does not
     */
    evaluate: function(feature) {
        for (var i=0, len=this.fids.length; i<len; i++) {
            var fid = feature.fid || feature.id;
            if (fid == this.fids[i]) {
                return true;
            }
        }
        return false;
    },
    
    CLASS_NAME: "OpenLayers.Filter.FeatureId"
});
