/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/BaseTypes/Class.js
 */

/**
 * Class: OpenLayers.Protocol
 * Abstract vector layer protocol class.  Not to be instantiated directly.  Use
 *     one of the protocol subclasses instead.
 */
OpenLayers.Protocol = OpenLayers.Class({
    
    /**
     * Property: format
     * {<OpenLayers.Format>} The format used by this protocol.
     */
    format: null,
    
    /**
     * Property: options
     * {Object} Any options sent to the constructor.
     */
    options: null,

    /**
     * Property: autoDestroy
     * {Boolean} The creator of the protocol can set autoDestroy to false
     *      to fully control when the protocol is destroyed. Defaults to
     *      true.
     */
    autoDestroy: true,
   
    /**
     * Property: defaultFilter
     * {<OpenLayers.Filter>} Optional default filter to read requests
     */
    defaultFilter: null,
    
    /**
     * Constructor: OpenLayers.Protocol
     * Abstract class for vector protocols.  Create instances of a subclass.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        options = options || {};
        OpenLayers.Util.extend(this, options);
        this.options = options;
    },

    /**
     * Method: mergeWithDefaultFilter
     * Merge filter passed to the read method with the default one
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>}
     */
    mergeWithDefaultFilter: function(filter) {
        var merged;
        if (filter && this.defaultFilter) {
            merged = new OpenLayers.Filter.Logical({
                type: OpenLayers.Filter.Logical.AND,
                filters: [this.defaultFilter, filter]
            });
        } else {
            merged = filter || this.defaultFilter || undefined;
        }
        return merged;
    },

    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        this.options = null;
        this.format = null;
    },
    
    /**
     * APIMethod: read
     * Construct a request for reading new features.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     * object, the same object will be passed to the callback function passed
     * if one exists in the options object.
     */
    read: function(options) {
        options = options || {};
        options.filter = this.mergeWithDefaultFilter(options.filter);
    },
    
    
    /**
     * APIMethod: create
     * Construct a request for writing newly created features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     * object, the same object will be passed to the callback function passed
     * if one exists in the options object.
     */
    create: function() {
    },
    
    /**
     * APIMethod: update
     * Construct a request updating modified features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *            {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     * object, the same object will be passed to the callback function passed
     * if one exists in the options object.
     */
    update: function() {
    },
    
    /**
     * APIMethod: delete
     * Construct a request deleting a removed feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     * object, the same object will be passed to the callback function passed
     * if one exists in the options object.
     */
    "delete": function() {
    },

    /**
     * APIMethod: commit
     * Go over the features and for each take action
     * based on the feature state. Possible actions are create,
     * update and delete.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})}
     * options - {Object} Object whose possible keys are "create", "update",
     *      "delete", "callback" and "scope", the values referenced by the
     *      first three are objects as passed to the "create", "update", and
     *      "delete" methods, the value referenced by the "callback" key is
     *      a function which is called when the commit operation is complete
     *      using the scope referenced by the "scope" key.
     *
     * Returns:
     * {Array({<OpenLayers.Protocol.Response>})} An array of
     * <OpenLayers.Protocol.Response> objects.
     */
    commit: function() {
    },

    /**
     * Method: abort
     * Abort an ongoing request.
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>}
     */
    abort: function(response) {
    },
   
    /**
     * Method: createCallback
     * Returns a function that applies the given public method with resp and
     *     options arguments.
     *
     * Parameters:
     * method - {Function} The method to be applied by the callback.
     * response - {<OpenLayers.Protocol.Response>} The protocol response object.
     * options - {Object} Options sent to the protocol method
     */
    createCallback: function(method, response, options) {
        return OpenLayers.Function.bind(function() {
            method.apply(this, [response, options]);
        }, this);
    },
   
    CLASS_NAME: "OpenLayers.Protocol" 
});

/**
 * Class: OpenLayers.Protocol.Response
 * Protocols return Response objects to their users.
 */
OpenLayers.Protocol.Response = OpenLayers.Class({
    /**
     * Property: code
     * {Number} - OpenLayers.Protocol.Response.SUCCESS or
     *            OpenLayers.Protocol.Response.FAILURE
     */
    code: null,

    /**
     * Property: requestType
     * {String} The type of request this response corresponds to. Either
     *      "create", "read", "update" or "delete".
     */
    requestType: null,

    /**
     * Property: last
     * {Boolean} - true if this is the last response expected in a commit,
     * false otherwise, defaults to true.
     */
    last: true,

    /**
     * Property: features
     * {Array({<OpenLayers.Feature.Vector>})} or {<OpenLayers.Feature.Vector>}
     * The features returned in the response by the server. Depending on the 
     * protocol's read payload, either features or data will be populated.
     */
    features: null,

    /**
     * Property: data
     * {Object}
     * The data returned in the response by the server. Depending on the 
     * protocol's read payload, either features or data will be populated.
     */
    data: null,

    /**
     * Property: reqFeatures
     * {Array({<OpenLayers.Feature.Vector>})} or {<OpenLayers.Feature.Vector>}
     * The features provided by the user and placed in the request by the
     *      protocol.
     */
    reqFeatures: null,

    /**
     * Property: priv
     */
    priv: null,

    /**
     * Property: error
     * {Object} The error object in case a service exception was encountered.
     */
    error: null,

    /**
     * Constructor: OpenLayers.Protocol.Response
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Util.extend(this, options);
    },

    /**
     * Method: success
     *
     * Returns:
     * {Boolean} - true on success, false otherwise
     */
    success: function() {
        return this.code > 0;
    },

    CLASS_NAME: "OpenLayers.Protocol.Response"
});

OpenLayers.Protocol.Response.SUCCESS = 1;
OpenLayers.Protocol.Response.FAILURE = 0;
