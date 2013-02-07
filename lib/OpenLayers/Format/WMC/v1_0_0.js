/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/WMC/v1.js
 */

/**
 * Class: OpenLayers.Format.WMC.v1_0_0
 * Read and write WMC version 1.0.0.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.WMC.v1>
 */
OpenLayers.Format.WMC.v1_0_0 = OpenLayers.Class(
    OpenLayers.Format.WMC.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.0.0
     */
    VERSION: "1.0.0",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/context
     *     http://schemas.opengis.net/context/1.0.0/context.xsd
     */
    schemaLocation: "http://www.opengis.net/context http://schemas.opengis.net/context/1.0.0/context.xsd",

    /**
     * Constructor: OpenLayers.Format.WMC.v1_0_0
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
     * Method: read_wmc_SRS
     */
    read_wmc_SRS: function(layerContext, node) {
        var srs    = this.getChildValue(node);
        if (typeof layerContext.projections != "object") {
            layerContext.projections = {};
        }
        var values = srs.split(/ +/);
        for (var i=0, len=values.length; i<len; i++) {
            layerContext.projections[values[i]] = true;
        }
    },

    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer context object. This method adds
     *     elements specific to version 1.0.0.
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
    
        // optional SRS element(s)
        if (context.srs) {
            var projections = [];
            for(var name in context.srs) {
                projections.push(name);
            }
            node.appendChild(this.createElementDefaultNS("SRS", projections.join(" ")));
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
    },    

    CLASS_NAME: "OpenLayers.Format.WMC.v1_0_0" 

});
