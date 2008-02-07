/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMC/v1.js
 */

/**
 * Class: OpenLayers.Format.WMC.v1_1_0
 * Read and write WMC version 1.1.0.
 *
 * Differences between 1.1.0 and 1.0.0:
 *     - 1.1.0 Layers have optional sld:MinScaleDenominator and
 *       sld:MaxScaleDenominator
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMC.v1>
 */
OpenLayers.Format.WMC.v1_1_0 = OpenLayers.Class(
    OpenLayers.Format.WMC.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.1.0
     */
    VERSION: "1.1.0",

    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/context
     *     http://schemas.opengis.net/context/1.1.0/context.xsd
     */
    schemaLocation: "http://www.opengis.net/context http://schemas.opengis.net/context/1.1.0/context.xsd",

    /**
     * Constructor: OpenLayers.Format.WMC.v1_1_0
     * Instances of this class are not created directly.  Use the
     *     <OpenLayers.Format.WMC> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.WMC.v1.prototype.initialize.apply(
            this, [options]
        );
    },

    /**
     * Method: read_sld_MinScaleDenominator
     * Read a sld:MinScaleDenominator node.
     *
     * Parameters:
     * layerInfo - {Object} An object representing a layer.
     * node - {Element} An element node.
     */
    read_sld_MinScaleDenominator: function(layerInfo, node) {
        layerInfo.options.maxScale = this.getChildValue(node);
    },

    /**
     * Method: read_sld_MaxScaleDenominator
     * Read a sld:MaxScaleDenominator node.
     *
     * Parameters:
     * layerInfo - {Object} An object representing a layer.
     * node - {Element} An element node.
     */
    read_sld_MaxScaleDenominator: function(layerInfo, node) {
        layerInfo.options.minScale = this.getChildValue(node);
    },

    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer object.  This method adds elements
     *     specific to version 1.1.0.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.WMS>} Layer object.
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer: function(layer) {
        var node = OpenLayers.Format.WMC.v1.prototype.write_wmc_Layer.apply(
            this, [layer]
        );
        
        // min/max scale denominator elements go before the 4th element in v1
        if(layer.options.resolutions || layer.options.scales ||
           layer.options.minResolution || layer.options.maxScale) {
            var minSD = this.createElementNS(
                this.namespaces.sld, "sld:MinScaleDenominator"
            );
            minSD.appendChild(this.createTextNode(layer.maxScale.toPrecision(10)));
            node.insertBefore(minSD, node.childNodes[3]);
        }
        
        if(layer.options.resolutions || layer.options.scales ||
           layer.options.maxResolution || layer.options.minScale) {
            var maxSD = this.createElementNS(
                this.namespaces.sld, "sld:MaxScaleDenominator"
            );
            maxSD.appendChild(this.createTextNode(layer.minScale.toPrecision(10)));
            node.insertBefore(maxSD, node.childNodes[4]);
        }
        
        return node;
        
    },

    CLASS_NAME: "OpenLayers.Format.WMC.v1_1_0" 

});