/* Copyright (c) 2006-2007 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     * APIProperty:
     * dataFrom  - {<OpenLayers.Layer.PointTrack.dataFrom>} optional. If the
     *             lines should get the data/attributes from one of the two
     *             points, creating it, which one should it be?
     */
    dataFrom: null,
    
    /**
     * Constructor: OpenLayers.PointTrack
     * Constructor for a new OpenLayers.PointTrack instance.
     *
     * Parameters:
     * name     - {String} name of the layer
     * options  - {Object} Optional object with properties to tag onto the
     *            instance.
     */    
    initialize: function(name, options) {
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, arguments);
    },
        
    /**
     * APIMethod: addNodes
     * Adds point features that will be used to create lines from, using point
     * pairs. The first point of a pair will be the source node, the second
     * will be the target node.
     * 
     * Parameters:
     * pointFeatures - {Array(<OpenLayers.Feature>)}
     * 
     */
    addNodes: function(pointFeatures) {
        if (pointFeatures.length < 2) {
            OpenLayers.Console.error(
                    "At least two point features have to be added to create" +
                    "a line from");
            return;
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
                OpenLayers.Console.error(
                        "Only features with point geometries are supported.");
                return;
            }
            
            if(i > 0) {
                var attributes = (this.dataFrom != null) ?
                        (pointFeatures[i+this.dataFrom].data ||
                                pointFeatures[i+this.dataFrom].attributes) :
                        null;
                var line = new OpenLayers.Geometry.LineString([startPoint,
                        endPoint]);
                        
                lines[i-1] = new OpenLayers.Feature.Vector(line, attributes);
            }
            
            startPoint = endPoint;
        }

        this.addFeatures(lines);
    },
    
    CLASS_NAME: "OpenLayers.Layer.PointTrack"
});

/**
 * Constant: OpenLayers.Layer.PointTrack.dataFrom
 * {Object} with the following keys
 * - SOURCE_NODE: take data/attributes from the source node of the line
 * - TARGET_NODE: take data/attributes from the target node of the line
 */
OpenLayers.Layer.PointTrack.dataFrom = {'SOURCE_NODE': -1, 'TARGET_NODE': 0};

