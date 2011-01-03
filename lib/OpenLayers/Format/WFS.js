/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/GML.js
 * @requires OpenLayers/Console.js
 * @requires OpenLayers/Lang.js
 */

/**
 * Class: OpenLayers.Format.WFS
 * Read/Write WFS. 
 *
 * Inherits from:
 *  - <OpenLayers.Format.GML>
 */
OpenLayers.Format.WFS = OpenLayers.Class(OpenLayers.Format.GML, {
    
    /** 
     * Property: layer
     */
    layer: null,
    
    /**
     * APIProperty: wfsns
     */
    wfsns: "http://www.opengis.net/wfs",
    
    /**
     * Property: ogcns
     */
    ogcns: "http://www.opengis.net/ogc",
    
    /*
     * Constructor: OpenLayers.Format.WFS
     * Create a WFS-T formatter. This requires a layer: that layer should
     * have two properties: geometry_column and typename. The parser
     * for this format is subclassed entirely from GML: There is a writer 
     * only, which uses most of the code from the GML layer, and wraps
     * it in transactional elements.
     * 
     * Parameters: 
     * options - {Object} 
     * layer - {<OpenLayers.Layer>} 
     */
    
    initialize: function(options, layer) {
        OpenLayers.Format.GML.prototype.initialize.apply(this, [options]);
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
     * Method: write 
     * Takes a feature list, and generates a WFS-T Transaction 
     *
     * Parameters:
     * features - {Array(<OpenLayers.Feature.Vector>)} 
     */
    write: function(features) {
    
        var transaction = this.createElementNS(this.wfsns, 'wfs:Transaction');
        transaction.setAttribute("version","1.0.0");
        transaction.setAttribute("service","WFS");
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
        
        return OpenLayers.Format.XML.prototype.write.apply(this,[transaction]);
    },
   
    /**
     * Method: createFeatureXML
     *
     * Parameters: 
     * feature - {<OpenLayers.Feature.Vector>}
     */ 
    createFeatureXML: function(feature) {
        var geometryNode = this.buildGeometryNode(feature.geometry);
        var geomContainer = this.createElementNS(this.featureNS, "feature:" + this.geometryName);
        geomContainer.appendChild(geometryNode);
        var featureContainer = this.createElementNS(this.featureNS, "feature:" + this.featureName);
        featureContainer.appendChild(geomContainer);
        for(var attr in feature.attributes) {
            var attrText = this.createTextNode(feature.attributes[attr]); 
            var nodename = attr;
            if (attr.search(":") != -1) {
                nodename = attr.split(":")[1];
            }    
            var attrContainer = this.createElementNS(this.featureNS, "feature:" + nodename);
            attrContainer.appendChild(attrText);
            featureContainer.appendChild(attrContainer);
        }    
        return featureContainer;
    },
    
    /**
     * Method: insert 
     * Takes a feature, and generates a WFS-T Transaction "Insert" 
     *
     * Parameters: 
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    insert: function(feature) {
        var insertNode = this.createElementNS(this.wfsns, 'wfs:Insert');
        insertNode.appendChild(this.createFeatureXML(feature));
        return insertNode;
    },
    
    /**
     * Method: update
     * Takes a feature, and generates a WFS-T Transaction "Update" 
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    update: function(feature) {
        if (!feature.fid) { OpenLayers.Console.userError(OpenLayers.i18n("noFID")); }
        var updateNode = this.createElementNS(this.wfsns, 'wfs:Update');
        updateNode.setAttribute("typeName", this.featurePrefix + ':' + this.featureName); 
        updateNode.setAttribute("xmlns:" + this.featurePrefix, this.featureNS); 

        var propertyNode = this.createElementNS(this.wfsns, 'wfs:Property');
        var nameNode = this.createElementNS(this.wfsns, 'wfs:Name');
        
        var txtNode = this.createTextNode(this.geometryName);
        nameNode.appendChild(txtNode);
        propertyNode.appendChild(nameNode);
        
        var valueNode = this.createElementNS(this.wfsns, 'wfs:Value');
        
        var geometryNode = this.buildGeometryNode(feature.geometry);
        
        if(feature.layer){
            geometryNode.setAttribute(
                "srsName", feature.layer.projection.getCode()
            );
        }
        
        valueNode.appendChild(geometryNode);
        
        propertyNode.appendChild(valueNode);
        updateNode.appendChild(propertyNode);
        
         // add in attributes
        for(var propName in feature.attributes) {
            propertyNode = this.createElementNS(this.wfsns, 'wfs:Property');
            nameNode = this.createElementNS(this.wfsns, 'wfs:Name');
            nameNode.appendChild(this.createTextNode(propName));
            propertyNode.appendChild(nameNode);
            valueNode = this.createElementNS(this.wfsns, 'wfs:Value');
            valueNode.appendChild(this.createTextNode(feature.attributes[propName]));
            propertyNode.appendChild(valueNode);
            updateNode.appendChild(propertyNode);
        }
        
        
        var filterNode = this.createElementNS(this.ogcns, 'ogc:Filter');
        var filterIdNode = this.createElementNS(this.ogcns, 'ogc:FeatureId');
        filterIdNode.setAttribute("fid", feature.fid);
        filterNode.appendChild(filterIdNode);
        updateNode.appendChild(filterNode);

        return updateNode;
    },
    
    /**
     * Method: remove 
     * Takes a feature, and generates a WFS-T Transaction "Delete" 
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} 
     */
    remove: function(feature) {
        if (!feature.fid) { 
            OpenLayers.Console.userError(OpenLayers.i18n("noFID")); 
            return false; 
        }
        var deleteNode = this.createElementNS(this.wfsns, 'wfs:Delete');
        deleteNode.setAttribute("typeName", this.featurePrefix + ':' + this.featureName); 
        deleteNode.setAttribute("xmlns:" + this.featurePrefix, this.featureNS); 

        var filterNode = this.createElementNS(this.ogcns, 'ogc:Filter');
        var filterIdNode = this.createElementNS(this.ogcns, 'ogc:FeatureId');
        filterIdNode.setAttribute("fid", feature.fid);
        filterNode.appendChild(filterIdNode);
        deleteNode.appendChild(filterNode);

        return deleteNode;
    },

    /**
     * APIMethod: destroy
     * Remove ciruclar ref to layer 
     */
    destroy: function() {
        this.layer = null;
    },

    CLASS_NAME: "OpenLayers.Format.WFS" 
});    
