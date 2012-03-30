/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Layer.PointTrack
 * Vector layer to display ordered point features as a line, creating one
 * LineString feature for each pair of two points.
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector> 
 */
OpenLayers.Layer.PointTrack = OpenLayers.Class(OpenLayers.Layer.Vector, {
  
    /**
     * APIProperty: dataFrom
     *     {<OpenLayers.Layer.PointTrack.TARGET_NODE>} or
     *     {<OpenLayers.Layer.PointTrack.SOURCE_NODE>} optional. If the lines
     *     should get the data/attributes from one of the two points it is
     *     composed of, which one should it be?
     */
    dataFrom: null,
    
    /**
     * APIProperty: styleFrom
     *     {<OpenLayers.Layer.PointTrack.TARGET_NODE>} or
     *     {<OpenLayers.Layer.PointTrack.SOURCE_NODE>} optional. If the lines
     *     should get the style from one of the two points it is composed of,
     *     which one should it be?
     */
    styleFrom: null,
    
    /**
     * Constructor: OpenLayers.PointTrack
     * Constructor for a new OpenLayers.PointTrack instance.
     *
     * Parameters:
     * name     - {String} name of the layer
     * options  - {Object} Optional object with properties to tag onto the
     *            instance.
     */    
        
    /**
     * APIMethod: addNodes
     * Adds point features that will be used to create lines from, using point
     * pairs. The first point of a pair will be the source node, the second
     * will be the target node.
     * 
     * Parameters:
     * pointFeatures - {Array(<OpenLayers.Feature>)}
     * options - {Object}
     * 
     * Supported options:
     * silent - {Boolean} true to suppress (before)feature(s)added events
     */
    addNodes: function(pointFeatures, options) {
        if (pointFeatures.length < 2) {
            throw new Error("At least two point features have to be added to " +
                            "create a line from");
        }
        
        var lines = new Array(pointFeatures.length-1);
        
        var pointFeature, startPoint, endPoint;
        for(var i=0, len=pointFeatures.length; i<len; i++) {
            pointFeature = pointFeatures[i];
            endPoint = pointFeature.geometry;
            
            if (!endPoint) {
              var lonlat = pointFeature.lonlat;
              endPoint = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
            } else if(endPoint.CLASS_NAME != "OpenLayers.Geometry.Point") {
                throw new TypeError("Only features with point geometries are supported.");
            }
            
            if(i > 0) {
                var attributes = (this.dataFrom != null) ?
                        (pointFeatures[i+this.dataFrom].data ||
                                pointFeatures[i+this.dataFrom].attributes) :
                        null;
                var style = (this.styleFrom != null) ?
                        (pointFeatures[i+this.styleFrom].style) :
                        null;
                var line = new OpenLayers.Geometry.LineString([startPoint,
                        endPoint]);
                        
                lines[i-1] = new OpenLayers.Feature.Vector(line, attributes,
                    style);
            }
            
            startPoint = endPoint;
        }

        this.addFeatures(lines, options);
    },
    
    CLASS_NAME: "OpenLayers.Layer.PointTrack"
});

/**
 * Constant: OpenLayers.Layer.PointTrack.SOURCE_NODE
 * {Number} value for <OpenLayers.Layer.PointTrack.dataFrom> and
 * <OpenLayers.Layer.PointTrack.styleFrom>
 */
OpenLayers.Layer.PointTrack.SOURCE_NODE = -1;

/**
 * Constant: OpenLayers.Layer.PointTrack.TARGET_NODE
 * {Number} value for <OpenLayers.Layer.PointTrack.dataFrom> and
 * <OpenLayers.Layer.PointTrack.styleFrom>
 */
OpenLayers.Layer.PointTrack.TARGET_NODE = 0;

/**
 * Constant: OpenLayers.Layer.PointTrack.dataFrom
 * {Object} with the following keys - *deprecated*
 * - SOURCE_NODE: take data/attributes from the source node of the line
 * - TARGET_NODE: take data/attributes from the target node of the line
 */
OpenLayers.Layer.PointTrack.dataFrom = {'SOURCE_NODE': -1, 'TARGET_NODE': 0};
