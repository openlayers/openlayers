/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Console.js
 * @requires OpenLayers/Format.js
 * @requires OpenLayers/Filter/Spatial.js
 * @requires OpenLayers/Filter/Comparison.js
 * @requires OpenLayers/Filter/Logical.js
 */

/**
 * Class: OpenLayers.Format.QueryStringFilter
 * Parser for reading a query string and creating a simple filter.
 *
 * Inherits from:
 *  - <OpenLayers.Format>
 */
OpenLayers.Format.QueryStringFilter = (function() {

    /** 
     * Map the OpenLayers.Filter.Comparison types to the operation strings of 
     * the protocol.
     */
    var cmpToStr = {};
    cmpToStr[OpenLayers.Filter.Comparison.EQUAL_TO] = "eq";
    cmpToStr[OpenLayers.Filter.Comparison.NOT_EQUAL_TO] = "ne";
    cmpToStr[OpenLayers.Filter.Comparison.LESS_THAN] = "lt";
    cmpToStr[OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO] = "lte";
    cmpToStr[OpenLayers.Filter.Comparison.GREATER_THAN] = "gt";
    cmpToStr[OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO] = "gte";
    cmpToStr[OpenLayers.Filter.Comparison.LIKE] = "ilike";

    /**
     * Function: regex2value
     * Convert the value from a regular expression string to a LIKE/ILIKE
     * string known to the web service.
     *
     * Parameters:
     * value - {String} The regex string.
     *
     * Returns:
     * {String} The converted string.
     */
    function regex2value(value) {

        // highly sensitive!! Do not change this without running the
        // Protocol/HTTP.html unit tests

        // convert % to \%
        value = value.replace(/%/g, "\\%");

        // convert \\. to \\_ (\\.* occurences converted later)
        value = value.replace(/\\\\\.(\*)?/g, function($0, $1) {
            return $1 ? $0 : "\\\\_";
        });

        // convert \\.* to \\%
        value = value.replace(/\\\\\.\*/g, "\\\\%");

        // convert . to _ (\. and .* occurences converted later)
        value = value.replace(/(\\)?\.(\*)?/g, function($0, $1, $2) {
            return $1 || $2 ? $0 : "_";
        });

        // convert .* to % (\.* occurnces converted later)
        value = value.replace(/(\\)?\.\*/g, function($0, $1) {
            return $1 ? $0 : "%";
        });

        // convert \. to .
        value = value.replace(/\\\./g, ".");

        // replace \* with * (watching out for \\*)
        value = value.replace(/(\\)?\\\*/g, function($0, $1) {
            return $1 ? $0 : "*";
        });

        return value;
    }
    
    return OpenLayers.Class(OpenLayers.Format, {
        
        /**
         * Property: wildcarded.
         * {Boolean} If true percent signs are added around values
         *     read from LIKE filters, for example if the protocol
         *     read method is passed a LIKE filter whose property
         *     is "foo" and whose value is "bar" the string
         *     "foo__ilike=%bar%" will be sent in the query string;
         *     defaults to false.
         */
        wildcarded: false,

        /**
         * APIProperty: srsInBBOX
         * {Boolean} Include the SRS identifier in BBOX query string parameter.  
         *     Default is false.  If true and the layer has a projection object set,
         *     any BBOX filter will be serialized with a fifth item identifying the
         *     projection.  E.g. bbox=-1000,-1000,1000,1000,EPSG:900913
         */
        srsInBBOX: false,

        /**
         * APIMethod: write
         * Serialize an <OpenLayers.Filter> objects using the "simple" filter syntax for 
         *     query string parameters.  This function must be called as a method of
         *     a protocol instance.
         *
         * Parameters:
         * filter - {<OpenLayers.Filter>} filter to convert.
         * params - {Object} The parameters object.
         *
         * Returns:
         * {Object} The resulting parameters object.
         */
        write: function(filter, params) {
            params = params || {};
            var className = filter.CLASS_NAME;
            var filterType = className.substring(className.lastIndexOf(".") + 1);
            switch (filterType) {
                case "Spatial":
                    switch (filter.type) {
                        case OpenLayers.Filter.Spatial.BBOX:
                            params.bbox = filter.value.toArray();
                            if (this.srsInBBOX && filter.projection) {
                                params.bbox.push(filter.projection.getCode());
                            }
                            break;
                        case OpenLayers.Filter.Spatial.DWITHIN:
                            params.tolerance = filter.distance;
                            // no break here
                        case OpenLayers.Filter.Spatial.WITHIN:
                            params.lon = filter.value.x;
                            params.lat = filter.value.y;
                            break;
                        default:
                            OpenLayers.Console.warn(
                                "Unknown spatial filter type " + filter.type);
                    }
                    break;
                case "Comparison":
                    var op = cmpToStr[filter.type];
                    if (op !== undefined) {
                        var value = filter.value;
                        if (filter.type == OpenLayers.Filter.Comparison.LIKE) {
                            value = regex2value(value);
                            if (this.wildcarded) {
                                value = "%" + value + "%";
                            }
                        }
                        params[filter.property + "__" + op] = value;
                        params.queryable = params.queryable || [];
                        params.queryable.push(filter.property);
                    } else {
                        OpenLayers.Console.warn(
                            "Unknown comparison filter type " + filter.type);
                    }
                    break;
                case "Logical":
                    if (filter.type === OpenLayers.Filter.Logical.AND) {
                        for (var i=0,len=filter.filters.length; i<len; i++) {
                            params = this.write(filter.filters[i], params);
                        }
                    } else {
                        OpenLayers.Console.warn(
                            "Unsupported logical filter type " + filter.type);
                    }
                    break;
                default:
                    OpenLayers.Console.warn("Unknown filter type " + filterType);
            }
            return params;
        },
        
        CLASS_NAME: "OpenLayers.Format.QueryStringFilter"
        
    });


})();
