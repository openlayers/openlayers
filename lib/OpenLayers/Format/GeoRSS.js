/* Copyright (c) 2006-2007 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * @requires OpenLayers/Format.js
 *
 * Class: OpenLayers.Format.GeoRSS
 * Write-only GeoRSS. Create a new instance with the 
 *     <OpenLayers.Format.GeoRSS> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.GeoRSS = OpenLayers.Class(OpenLayers.Format, {
    
    /**
     * APIProperty: rssns
     * RSS namespace to use.
     */
    rssns: "http://backend.userland.com/rss2",
    
    /**
     * APIProperty: featurens
     * Feature Attributes namespace
     */
    featureNS: "http://mapserver.gis.umn.edu/mapserver",
    
    /**
     * APIProperty: georssns
     * GeoRSS namespace to use.
     */
    georssns: "http://www.georss.org/georss",
    
    
    /**
     * Constructor: OpenLayers.Format.GeoRSS
     * Create a new parser for GeoRSS
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *                    this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: write
     * Accept Feature Collection, and return a string. 
     * 
     * Parameters: 
     * features - Array({<OpenLayers.Feature.Vector>}) List of features to serialize into a string.
     */
     write: function(features) {
        var featureCollection = document.createElementNS(this.rssns, "rss");
        for (var i=0; i < features.length; i++) {
            featureCollection.appendChild(this.createFeatureXML(features[i]));
        }
        return featureCollection;
     },
    
    /**
     * Method: createFeatureXML
     * Accept an <OpenLayers.Feature.Vector>, and build a geometry for it.
     * 
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     *
     * Returns:
     * {DOMElement}
     */
    createFeatureXML: function(feature) {
        var geometryNode = this.buildGeometryNode(feature.geometry);
        var featureNode = document.createElementNS(this.rssns, "item");
        var titleNode = document.createElementNS(this.rssns, "title");
        titleNode.appendChild(document.createTextNode(feature.attributes.title ? feature.attributes.title : ""));
        var descNode = document.createElementNS(this.rssns, "description");
        descNode.appendChild(document.createTextNode(feature.attributes.description ? feature.attributes.description : ""));
        featureNode.appendChild(titleNode);
        featureNode.appendChild(descNode);
        for(var attr in feature.attributes) {
            var attrText = document.createTextNode(feature.attributes[attr]); 
            var nodename = attr;
            if (attr.search(":") != -1) {
                nodename = attr.split(":")[1];
            }    
            var attrContainer = document.createElementNS(this.featureNS, "feature:"+nodename);
            attrContainer.appendChild(attrText);
            featureNode.appendChild(attrContainer);
        }    
        featureNode.appendChild(geometryNode);
        return featureNode;
    },    
    
    /** 
     * Method: buildGeometryNode
     * builds a GeoRSS node with a given geometry
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>} 
     */
    buildGeometryNode: function(geometry) {
        var gml = "";
        // match MultiPolygon or Polygon
        if (geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                gml = document.createElementNS(this.georssns, 'georss:polygon');
                
                gml.appendChild(this.buildCoordinatesNode(geometry.components[0]));
            }
        // match MultiLineString or LineString
        else if (geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {
                     gml = document.createElementNS(this.georssns, 'georss:line');
                     
                     gml.appendChild(this.buildCoordinatesNode(geometry));
                 }
        // match MultiPoint or Point
        else if (geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                gml = document.createElementNS(this.georssns, 'georss:point');
                gml.appendChild(this.buildCoordinatesNode(geometry));
        } else {    
          alert("Couldn't parse " + geometry.CLASS_NAME);
        }  
        return gml;         
    },
    
    /** 
     * Method: buildCoordinatesNode
     * 
     * Parameters:
     * geometry - {<OpenLayers.Geometry>}
     */
    buildCoordinatesNode: function(geometry) {
        var points = null;
        
        if (geometry.components) {
            points = geometry.components;
        }

        var path = "";
        if (points) {
            for (var i = 0; i < points.length; i++) {
                path += points[i].y + " " + points[i].x + " ";
            }
        } else {
           path += geometry.y + " " + geometry.x + " ";
        }
        return document.createTextNode(path);
    },

    CLASS_NAME: "OpenLayers.Format.GeoRSS" 
});     
