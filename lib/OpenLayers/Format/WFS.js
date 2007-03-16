/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */

/**
 * Read/WRite WFS. 
 * @requires OpenLayers/Format/GML.js
 */
OpenLayers.Format.WFS = OpenLayers.Class.create();
OpenLayers.Format.WFS.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Format.GML, {
    
    layer: null,
    
    wfsns: "http://www.opengis.net/wfs",
    
    /*
     * Create a WFS-T formatter. This requires a layer: that layer should
     * have two properties: geometry_column and typename. The parser
     * for this format is subclassed entirely from GML: There is a writer 
     * only, which uses most of the code from the GML layer, and wraps
     * it in transactional elements.
     * @param {Object} options 
     * @param OpenLayers.Layer layer
     */
    
    initialize: function(options, layer) {
        OpenLayers.Format.GML.prototype.initialize.apply(this, arguments);
        this.layer = layer;
        if (this.layer.featureNS) {
            this.featureNS = this.layer.featureNS;
        }    
        if (this.layer.options.geometry_column) {
            this.geometryName = this.layer.options.geometry_column;
        }
        if (this.layer.options.typename) {
            this.featureName = this.layer.options.typename;
        }
    },
    
    /**
     * write 
     * Takes a feature list, and generates a WFS-T Transaction 
     *
     * @param Array 
     */
    write: function(features) {
        
        var transaction = document.createElementNS('http://www.opengis.net/wfs', 'wfs:Transaction');
        for (var i=0; i < features.length; i++) {
            switch (features[i].state) {
                case OpenLayers.State.INSERT:
                    transaction.appendChild(this.insert(features[i]));
                    break;
                case OpenLayers.State.UPDATE:
                    transaction.appendChild(this.update(features[i]));
                    break;
                case OpenLayers.State.DELETE:
                    transaction.appendChild(this.remove(features[i]));
                    break;
            }
        }
        return transaction;
    },
    
    createFeatureXML: function(feature) {
        var geometryNode = this.buildGeometryNode(feature.geometry);
        var geomContainer = document.createElementNS(this.featureNS, "feature:" + this.geometryName);
        geomContainer.appendChild(geometryNode);
        var featureContainer = document.createElementNS(this.featureNS, "feature:" + this.featureName);
        featureContainer.appendChild(geomContainer);
        for(var attr in feature.attributes) {
            var attrText = document.createTextNode(feature.attributes[attr]); 
            var nodename = attr;
            if (attr.search(":") != -1) {
                nodename = attr.split(":")[1];
            }    
            var attrContainer = document.createElementNS(this.featureNS, "feature:" + nodename);
            attrContainer.appendChild(attrText);
            featureContainer.appendChild(attrContainer);
        }    
        return featureContainer;
    },
    
    /**
     * insert 
     * Takes a feature, and generates a WFS-T Transaction "Insert" 
     *
     * @param OpenLayers.Feature.Vector
     */
    insert: function(feature) {
        var insertNode = document.createElementNS(this.wfsns, 'wfs:Insert');
        insertNode.appendChild(this.createFeatureXML(feature));
        return insertNode;
    },
    
    /**
     * update
     * Takes a feature, and generates a WFS-T Transaction "Update" 
     *
     * @param OpenLayers.Feature.Vector
     */
    update: function(feature) {
        if (!feature.fid) { alert("Can't update a feature for which there is no FID."); }
        var updateNode = document.createElementNS(this.wfsns, 'wfs:Update');
        updateNode.setAttribute("typeName", this.layerName);

        var propertyNode = document.createElementNS(this.wfsns, 'wfs:Property');
        var nameNode = document.createElementNS('http://www.opengis.net/wfs', 'wfs:Name');
        
        var txtNode = document.createTextNode(this.geometryName);
        nameNode.appendChild(txtNode);
        propertyNode.appendChild(nameNode);
        
        var valueNode = document.createElementNS('http://www.opengis.net/wfs', 'wfs:Value');
        valueNode.appendChild(this.buildGeometryNode(feature.geometry));
        
        propertyNode.appendChild(valueNode);
        updateNode.appendChild(propertyNode);
        
        var filterNode = document.createElementNS('http://www.opengis.net/ogc', 'ogc:Filter');
        var filterIdNode = document.createElementNS('http://www.opengis.net/ogc', 'ogc:FeatureId');
        filterIdNode.setAttribute("fid", feature.fid);
        filterNode.appendChild(filterIdNode);
        updateNode.appendChild(filterNode);

        return updateNode;
    },
    
    /**
     * delete
     * Takes a feature, and generates a WFS-T Transaction "Delete" 
     *
     * @param OpenLayers.Feature.Vector
     */
    remove: function(feature) {
        if (!feature.attributes.fid) { 
            alert("Can't update a feature for which there is no FID."); 
            return false; 
        }
        var deleteNode = document.createElementNS(this.featureNS, 'wfs:Delete');
        deleteNode.setAttribute("typeName", this.layerName);

        var filterNode = document.createElementNS('http://www.opengis.net/ogc', 'ogc:Filter');
        var filterIdNode = document.createElementNS('http://www.opengis.net/ogc', 'ogc:FeatureId');
        filterIdNode.setAttribute("fid", feature.attributes.fid);
        filterNode.appendChild(filterIdNode);
        deleteNode.appendChild(filterNode);

        return deleteNode;
    },

    destroy: function() {
        this.layer = null;
    }
});    
