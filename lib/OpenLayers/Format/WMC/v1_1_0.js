/* Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the Clear BSD license.  
 * See http://svn.openlayers.org/trunk/openlayers/license.txt for the
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
     * layerContext - {Object} An object representing a layer.
     * node - {Element} An element node.
     */
    read_sld_MinScaleDenominator: function(layerContext, node) {
        var minScaleDenominator = parseFloat(this.getChildValue(node));
        if (minScaleDenominator > 0) {
            layerContext.maxScale = minScaleDenominator;
        }
    },

    /**
     * Method: read_sld_MaxScaleDenominator
     * Read a sld:MaxScaleDenominator node.
     *
     * Parameters:
     * layerContext - {Object} An object representing a layer.
     * node - {Element} An element node.
     */
    read_sld_MaxScaleDenominator: function(layerContext, node) {
        layerContext.minScale = parseFloat(this.getChildValue(node));
    },

    /**
     * Method: read_wmc_SRS
     */
    read_wmc_SRS: function(layerContext, node) {
        if (! ("srs" in layerContext)) {
            layerContext.srs = {};
        }
        layerContext.srs[this.getChildValue(node)] = true;
    },

    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer context object. This method adds
     *     elements specific to version 1.1.0.
     *
     * Parameters:
     * context - {Object} A layer context object.}
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer: function(context) {
        var node = OpenLayers.Format.WMC.v1.prototype.write_wmc_Layer.apply(
            this, [context]
        );
        
        // min/max scale denominator elements go before the 4th element in v1
        if(context.maxScale) {
            var minSD = this.createElementNS(
                this.namespaces.sld, "sld:MinScaleDenominator"
            );
            minSD.appendChild(this.createTextNode(context.maxScale.toPrecision(16)));
            node.appendChild(minSD);
        }
        
        if(context.minScale) {
            var maxSD = this.createElementNS(
                this.namespaces.sld, "sld:MaxScaleDenominator"
            );
            maxSD.appendChild(this.createTextNode(context.minScale.toPrecision(16)));
            node.appendChild(maxSD);
        }

        // optional SRS element(s)
        if (context.srs) {
            for(var name in context.srs) {
                node.appendChild(this.createElementDefaultNS("SRS", name));
            }
        }

        // optional FormatList element
        node.appendChild(this.write_wmc_FormatList(context));

        // optional StyleList element
        node.appendChild(this.write_wmc_StyleList(context));
        
        // optional DimensionList element
        if (context.dimensions) {
            node.appendChild(this.write_wmc_DimensionList(context));
        }

        // OpenLayers specific properties go in an Extension element
        node.appendChild(this.write_wmc_LayerExtension(context));
        
        return node;
        
    },

    CLASS_NAME: "OpenLayers.Format.WMC.v1_1_0" 

});
