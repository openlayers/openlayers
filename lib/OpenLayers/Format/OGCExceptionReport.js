/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Format/XML.js
 */

/**
 * Class: OpenLayers.Format.OGCExceptionReport
 * Class to read exception reports for various OGC services and versions.
 *
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
OpenLayers.Format.OGCExceptionReport = OpenLayers.Class(OpenLayers.Format.XML, {

    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        ogc: "http://www.opengis.net/ogc"
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
     * Property: defaultPrefix
     */
    defaultPrefix: "ogc",

    /**
     * Constructor: OpenLayers.Format.OGCExceptionReport
     * Create a new parser for OGC exception reports.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */

    /**
     * APIMethod: read
     * Read OGC exception report data from a string, and return an object with
     * information about the exceptions.
     *
     * Parameters:
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object} Information about the exceptions that occurred.
     */
    read: function(data) {
        var result;
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var exceptionInfo = {exceptionReport: null}; 
        if (root) {
            this.readChildNodes(data, exceptionInfo);
            if (exceptionInfo.exceptionReport === null) {
                // fall-back to OWSCommon since this is a common output format for exceptions
                // we cannot easily use the ows readers directly since they differ for 1.0 and 1.1
                exceptionInfo = new OpenLayers.Format.OWSCommon().read(data);
            }
        }
        return exceptionInfo;
    },

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "ogc": {
            "ServiceExceptionReport": function(node, obj) {
                obj.exceptionReport = {exceptions: []};
                this.readChildNodes(node, obj.exceptionReport);
            },
            "ServiceException": function(node, exceptionReport) {
                var exception = {
                    code: node.getAttribute("code"),
                    locator: node.getAttribute("locator"),
                    text: this.getChildValue(node)
                };
                exceptionReport.exceptions.push(exception);
            }
        }
    },
    
    CLASS_NAME: "OpenLayers.Format.OGCExceptionReport"
    
});
