/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol/SOS.js
 * @requires OpenLayers/Format/SOSGetFeatureOfInterest.js
 */

/**
 * Class: OpenLayers.Protocol.SOS.v1_0_0
 * An SOS v1.0.0 Protocol for vector layers.  Create a new instance with the
 *     <OpenLayers.Protocol.SOS.v1_0_0> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
 OpenLayers.Protocol.SOS.v1_0_0 = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * APIProperty: fois
     * {Array(String)} Array of features of interest (foi)
     */
    fois: null,

    /**
     * Property: formatOptions
     * {Object} Optional options for the format.  If a format is not provided,
     *     this property can be used to extend the default format options.
     */
    formatOptions: null,
   
    /**
     * Constructor: OpenLayers.Protocol.SOS
     * A class for giving layers an SOS protocol.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options properties:
     * url - {String} URL to send requests to (required).
     * fois - {Array} The features of interest (required).
     */
    initialize: function(options) {
        OpenLayers.Protocol.prototype.initialize.apply(this, [options]);
        if(!options.format) {
            this.format = new OpenLayers.Format.SOSGetFeatureOfInterest(
                this.formatOptions);
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
     * APIMethod: read
     * Construct a request for reading new sensor positions. This is done by
     *     issuing one GetFeatureOfInterest request.
     */
    read: function(options) {
        options = OpenLayers.Util.extend({}, options);
        OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({requestType: "read"});
        var format = this.format;
        var data = OpenLayers.Format.XML.prototype.write.apply(format,
            [format.writeNode("sos:GetFeatureOfInterest", {fois: this.fois})]
        );
        response.priv = OpenLayers.Request.POST({
            url: options.url,
            callback: this.createCallback(this.handleRead, response, options),
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
     * options - {Object} The user options passed to the read call.
     */
    handleRead: function(response, options) {
        if(options.callback) {
            var request = response.priv;
            if(request.status >= 200 && request.status < 300) {
                // success
                response.features = this.parseFeatures(request);
                response.code = OpenLayers.Protocol.Response.SUCCESS;
            } else {
                // failure
                response.code = OpenLayers.Protocol.Response.FAILURE;
            }
            options.callback.call(options.scope, response);
        }
    },

    /**
     * Method: parseFeatures
     * Read HTTP response body and return features
     *
     * Parameters:
     * request - {XMLHttpRequest} The request object
     *
     * Returns:
     * {Array({<OpenLayers.Feature.Vector>})} Array of features
     */
    parseFeatures: function(request) {
        var doc = request.responseXML;
        if(!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        if(!doc || doc.length <= 0) {
            return null;
        }
        return this.format.read(doc);
    },

    CLASS_NAME: "OpenLayers.Protocol.SOS.v1_0_0"
});
