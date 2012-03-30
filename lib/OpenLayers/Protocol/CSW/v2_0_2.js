/* Copyright (c) 2006-2012 by OpenLayers Contributors (see authors.txt for 
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol/CSW.js
 * @requires OpenLayers/Format/CSWGetRecords/v2_0_2.js
 */

/**
 * Class: OpenLayers.Protocol.CSW.v2_0_2
 * CS-W (Catalogue services for the Web) version 2.0.2 protocol.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
OpenLayers.Protocol.CSW.v2_0_2 = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * Property: formatOptions
     * {Object} Optional options for the format.  If a format is not provided,
     *     this property can be used to extend the default format options.
     */
    formatOptions: null,

    /**
     * Constructor: OpenLayers.Protocol.CSW.v2_0_2
     * A class for CSW version 2.0.2 protocol management.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Protocol.prototype.initialize.apply(this, [options]);
        if(!options.format) {
            this.format = new OpenLayers.Format.CSWGetRecords.v2_0_2(OpenLayers.Util.extend({
            }, this.formatOptions));
        }
    },

    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        if(this.options && !this.options.format) {
            this.format.destroy();
        }
        this.format = null;
        OpenLayers.Protocol.prototype.destroy.apply(this);
    },

    /**
     * Method: read
     * Construct a request for reading new records from the Catalogue.
     */
    read: function(options) {
        options = OpenLayers.Util.extend({}, options);
        OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({requestType: "read"});

        var data = this.format.write(options.params);

        response.priv = OpenLayers.Request.POST({
            url: options.url,
            callback: this.createCallback(this.handleRead, response, options),
            params: options.params,
            headers: options.headers,
            data: data
        });

        return response;
    },

    /**
     * Method: handleRead
     * Deal with response from the read request.
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>} The response object to pass
     *     to the user callback.
     *     This response is given a code property, and optionally a data property.
     *     The latter represents the CSW records as returned by the call to
     *     the CSW format read method.
     * options - {Object} The user options passed to the read call.
     */
    handleRead: function(response, options) {
        if(options.callback) {
            var request = response.priv;
            if(request.status >= 200 && request.status < 300) {
                // success
                response.data = this.parseData(request);
                response.code = OpenLayers.Protocol.Response.SUCCESS;
            } else {
                // failure
                response.code = OpenLayers.Protocol.Response.FAILURE;
            }
            options.callback.call(options.scope, response);
        }
    },

    /**
     * Method: parseData
     * Read HTTP response body and return records
     *
     * Parameters:
     * request - {XMLHttpRequest} The request object
     *
     * Returns:
     * {Object} The CSW records as returned by the call to the format read method.
     */
    parseData: function(request) {
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        if(!doc || doc.length <= 0) {
            return null;
        }
        return this.format.read(doc);
    },

    CLASS_NAME: "OpenLayers.Protocol.CSW.v2_0_2"

});
