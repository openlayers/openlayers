/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */


/**
 * @requires OpenLayers/Rule.js
 */

/**
 * Class: OpenLayers.Rule.FeatureId
 * This class represents a ogc:FeatureId Rule, as being used for rule-based SLD
 * styling
 * 
 * Inherits from
 * - <OpenLayers.Rule>
 */
OpenLayers.Rule.FeatureId = OpenLayers.Class(OpenLayers.Rule, {

    /** 
     * APIProperty: fids
     * {Array(<String>)} Feature Ids to evaluate this rule against. To be passed
     * To be passed inside the params object.
     */
    fids: null,
    
    /** 
     * Constructor: OpenLayers.Rule.FeatureId
     * Creates an ogc:FeatureId rule.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *           rule
     * 
     * Returns:
     * {<OpenLayers.Rule.FeatureId>}
     */
    initialize: function(options) {
        this.fids = [];
        OpenLayers.Rule.prototype.initialize.apply(this, [options]);
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
     * {boolean} true if the rule applies, false if it does not
     */
    evaluate: function(feature) {
        if (!OpenLayers.Rule.prototype.evaluate.apply(this, arguments)) {
            return false;
        }
        for (var i=0; i<this.fids.length; i++) {
            var fid = feature.fid || feature.id;
            if (fid == this.fids[i]) {
                return true;
            }
        }
        return false;
    },
    
    CLASS_NAME: "OpenLayers.Rule.FeatureId"
});
