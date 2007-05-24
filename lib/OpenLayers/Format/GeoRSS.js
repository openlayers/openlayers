/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Write-only GeoRSS. 
 * @requires OpenLayers/Format.js
 */
OpenLayers.Format.GeoRSS = OpenLayers.Class.create();
OpenLayers.Format.GeoRSS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Format, {
    
    rssns: "http://backend.userland.com/rss2",
    
    featureNS: "http://mapserver.gis.umn.edu/mapserver",
    
    georssns: "http://www.georss.org/georss",
    
    /**
     * Accept Feature Collection, and return a string. 
     * 
     * @param {Array} List of features to serialize into a string.
     */
     write: function(features) {
        var featureCollection = document.createElementNS(this.rssns, "rss");
        for (var i=0; i < features.length; i++) {
            featureCollection.appendChild(this.createFeatureXML(features[i]));
        }
        return featureCollection;
     },
    
    /** 
     * Accept an OpenLayers.Feature.Vector, and build a geometry for it.
     * 
     * @param OpenLayers.Feature.Vector feature
     * @returns DOMElement
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
     * builds a GeoRSS node with a given geometry
     * 
     * @param {OpenLayers.Geometry} geometry
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

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Format.GeoRSS" 

});     
