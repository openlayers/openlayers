/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
  * full text of the license. */

/**
 * @requires OpenLayers/Filter.js
 */

/**
 * Class: OpenLayers.Filter.Spatial
 * This class represents a spatial filter.
 * Currently implemented: BBOX, DWithin and Intersects
 * 
 * Inherits from
 * - <OpenLayers.Filter>
 */
OpenLayers.Filter.Spatial = OpenLayers.Class(OpenLayers.Filter, {

    /**
     * APIProperty: type
     * {String} Type of spatial filter.
     *
     * The type should be one of:
     * - OpenLayers.Filter.Spatial.BBOX
     * - OpenLayers.Filter.Spatial.INTERSECTS
     * - OpenLayers.Filter.Spatial.DWITHIN
     */
    type: null,
    
    /**
     * APIProperty: property
     * {String} Name of the context property to compare.
     */
    property: null,
    
    /**
     * APIProperty: value
     * {<OpenLayers.Bounds> || <OpenLayers.Geometry>} The bounds or geometry
     *     to be used by the filter.  Use bounds for BBOX filters and geometry
     *     for INTERSECTS or DWITHIN filters.
     */
    value: null,

    /**
     * APIProperty: distance
     * {Number} The distance to use in a DWithin spatial filter.
     */
    distance: null,

    /**
     * APIProperty: distanceUnits
     * {String} The units to use for the distance, e.g. 'm'.
     */
    distanceUnits: null,
    
    /** 
     * Constructor: OpenLayers.Filter.Spatial
     * Creates a spatial filter.
     *
     * Parameters:
     * options - {Object} An optional object with properties to set on the
     *     filter.
     * 
     * Returns:
     * {<OpenLayers.Filter.Spatial>}
     */
    initialize: function(options) {
        OpenLayers.Filter.prototype.initialize.apply(this, [options]);
    },

   /**
    * Method: evaluate
    * Evaluates this filter for a specific feature.
    * 
    * Parameters:
    * feature - {<OpenLayers.Feature.Vector>} feature to apply the filter to.
    * 
    * Returns:
    * {Boolean} The feature meets filter criteria.
    */
    evaluate: function(feature) {
        var intersect = false;
        switch(this.type) {
            case OpenLayers.Filter.Spatial.BBOX:
            case OpenLayers.Filter.Spatial.INTERSECTS:
                if(feature.geometry) {
                    var geom = this.value;
                    if(this.value.CLASS_NAME == "OpenLayers.Bounds") {
                        geom = this.value.toGeometry();
                    }
                    if(feature.geometry.intersects(geom)) {
                        intersect = true;
                    }
                }
                break;
            default:
                OpenLayers.Console.error(
                    OpenLayers.i18n("filterEvaluateNotImplemented"));
                break;
        }
        return intersect;
    },

    CLASS_NAME: "OpenLayers.Filter.Spatial"
});

OpenLayers.Filter.Spatial.BBOX = "BBOX";
OpenLayers.Filter.Spatial.INTERSECTS = "INTERSECTS";
OpenLayers.Filter.Spatial.DWITHIN = "DWITHIN";
