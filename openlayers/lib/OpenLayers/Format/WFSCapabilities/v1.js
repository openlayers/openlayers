/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WFSCapabilities.js
 */

/**
 * Class: OpenLayers.Format.WFSCapabilities.v1
 * Abstract class not to be instantiated directly.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WFSCapabilities.v1 = OpenLayers.Class(
    OpenLayers.Format.WFSCapabilities, {
    
    /**
     * Constructor: OpenLayers.Format.WFSCapabilities.v1_1
     * Create an instance of one of the subclasses.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
        this.options = options;
    },

    /**
     * APIMethod: read
     * Read capabilities data from a string, and return a list of layers. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array} List of named layers.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var capabilities = {};
        var root = data.documentElement;
        this.runChildNodes(capabilities, root);
        return capabilities;
    },
    
    /**
     * Method: runChildNodes
     */
    runChildNodes: function(obj, node) {
        var children = node.childNodes;
        var childNode, processor;
        for(var i=0; i<children.length; ++i) {
            childNode = children[i];
            if(childNode.nodeType == 1) {
                processor = this["read_cap_" + childNode.nodeName];
                if(processor) {
                    processor.apply(this, [obj, childNode]);
                }
            }
        }
    },
    
    /**
     * Method: read_cap_FeatureTypeList
     */
    read_cap_FeatureTypeList: function(request, node) {
        var featureTypeList = {
            featureTypes: []
        };
        this.runChildNodes(featureTypeList, node);
        request.featureTypeList = featureTypeList;
    },
    
    /**
     * Method: read_cap_FeatureType
     */
    read_cap_FeatureType: function(featureTypeList, node, parentLayer) {
        var featureType = {};
        this.runChildNodes(featureType, node);
        featureTypeList.featureTypes.push(featureType);
    },
    
    /**
     * Method: read_cap_Name
     */
    read_cap_Name: function(obj, node) {
        var name = this.getChildValue(node);
        if(name) {
            var parts = name.split(":");
            obj.name = parts.pop();
            if(parts.length > 0) {
                obj.featureNS = this.lookupNamespaceURI(node, parts[0]);
            }
        }
    },

    /**
     * Method: read_cap_Title
     */
    read_cap_Title: function(obj, node) {
        var title = this.getChildValue(node);
        if(title) {
            obj.title = title;
        }
    },

    /**
     * Method: read_cap_Abstract
     */
    read_cap_Abstract: function(obj, node) {
        var abst = this.getChildValue(node);
        if(abst) {
            obj["abstract"] = abst;
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.WFSCapabilities.v1" 

});
