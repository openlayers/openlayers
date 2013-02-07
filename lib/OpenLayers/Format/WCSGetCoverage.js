/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 * @requires OpenLayers/Format/OWSCommon/v1_1_0.js
 */

/**
 * Class: OpenLayers.Format.WCSGetCoverage version 1.1.0
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.WCSGetCoverage = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        wcs: "http://www.opengis.net/wcs/1.1",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    /**
     * Property: regExes
     * Compiled regular expressions for manipulating strings.
     */
    regExes: {
        trimSpace: (/^\s*|\s*$/g),
        removeSpace: (/\s*/g),
        splitSpace: (/\s+/),
        trimComma: (/\s*,\s*/g)
    },

    /**
     * Constant: VERSION
     * {String} 1.1.2
     */
    VERSION: "1.1.2",

    /**
     * Property: schemaLocation
     * {String} Schema location
     */
    schemaLocation: "http://www.opengis.net/wcs/1.1 http://schemas.opengis.net/wcs/1.1/wcsGetCoverage.xsd",

    /**
     * Constructor: OpenLayers.Format.WCSGetCoverage
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * Method: write
     *
     * Parameters:
     * options - {Object} Optional object.
     *
     * Returns:
     * {String} A WCS GetCoverage request XML string.
     */
    write: function(options) {
        var node = this.writeNode("wcs:GetCoverage", options);
        this.setAttributeNS(
            node, this.namespaces.xsi,
            "xsi:schemaLocation", this.schemaLocation
        );
        return OpenLayers.Format.XML.prototype.write.apply(this, [node]);
    }, 

    /**
     * Property: writers
     * As a compliment to the readers property, this structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     */
    writers: {
        "wcs": {
            "GetCoverage": function(options) {
                var node = this.createElementNSPlus("wcs:GetCoverage", {
                    attributes: {
                        version: options.version || this.VERSION,
                        service: 'WCS'
                    } 
                }); 
                this.writeNode("ows:Identifier", options.identifier, node);
                this.writeNode("wcs:DomainSubset", options.domainSubset, node);
                this.writeNode("wcs:Output", options.output, node);
                return node; 
            },
            "DomainSubset": function(domainSubset) {
                var node = this.createElementNSPlus("wcs:DomainSubset", {});
                this.writeNode("ows:BoundingBox", domainSubset.boundingBox, node);
                if (domainSubset.temporalSubset) {
                    this.writeNode("wcs:TemporalSubset", domainSubset.temporalSubset, node);
                }
                return node;
            },
            "TemporalSubset": function(temporalSubset) {
                var node = this.createElementNSPlus("wcs:TemporalSubset", {});
                for (var i=0, len=temporalSubset.timePeriods.length; i<len; ++i) {
                    this.writeNode("wcs:TimePeriod", temporalSubset.timePeriods[i], node);
                }
                return node;
            },
            "TimePeriod": function(timePeriod) {
                var node = this.createElementNSPlus("wcs:TimePeriod", {});
                this.writeNode("wcs:BeginPosition", timePeriod.begin, node);
                this.writeNode("wcs:EndPosition", timePeriod.end, node);
                if (timePeriod.resolution) {
                    this.writeNode("wcs:TimeResolution", timePeriod.resolution, node);
                }
                return node;
            },
            "BeginPosition": function(begin) {
                var node = this.createElementNSPlus("wcs:BeginPosition", {
                    value: begin
                });
                return node;
            },
            "EndPosition": function(end) {
                var node = this.createElementNSPlus("wcs:EndPosition", {
                    value: end
                });
                return node;
            },
            "TimeResolution": function(resolution) {
                var node = this.createElementNSPlus("wcs:TimeResolution", {
                    value: resolution
                });
                return node;
            },
            "Output": function(output) {
                var node = this.createElementNSPlus("wcs:Output", {
                    attributes: {
                        format: output.format,
                        store: output.store
                    }
                });
                if (output.gridCRS) {
                    this.writeNode("wcs:GridCRS", output.gridCRS, node);
                }
                return node;
            },
            "GridCRS": function(gridCRS) {
                var node = this.createElementNSPlus("wcs:GridCRS", {});
                this.writeNode("wcs:GridBaseCRS", gridCRS.baseCRS, node);
                if (gridCRS.type) {
                    this.writeNode("wcs:GridType", gridCRS.type, node);
                }
                if (gridCRS.origin) {
                    this.writeNode("wcs:GridOrigin", gridCRS.origin, node);
                }
                this.writeNode("wcs:GridOffsets", gridCRS.offsets, node);
                if (gridCRS.CS) {
                    this.writeNode("wcs:GridCS", gridCRS.CS, node);
                }
                return node;
            },
            "GridBaseCRS": function(baseCRS) {
                return this.createElementNSPlus("wcs:GridBaseCRS", {
                    value: baseCRS
                });
            },
            "GridOrigin": function(origin) {
                return this.createElementNSPlus("wcs:GridOrigin", {
                    value: origin
                });
            },
            "GridType": function(type) {
                return this.createElementNSPlus("wcs:GridType", {
                    value: type
                });
            },
            "GridOffsets": function(offsets) {
                return this.createElementNSPlus("wcs:GridOffsets", {
                    value: offsets
                });
            },
            "GridCS": function(CS) {
                return this.createElementNSPlus("wcs:GridCS", {
                    value: CS
                });
            }
        },
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.writers.ows
    },
    
    CLASS_NAME: "OpenLayers.Format.WCSGetCoverage" 

});
