/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

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
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        this.options = null;
        this.format = null;
    },
    
    /**
     * Method: read
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
    read: function() {
    },
    
    
    /**
     * Method: create
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
     * Method: update
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
     * Method: delete
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
     * Method: commit
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
     * The features returned in the response by the server.
     */
    features: null,

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
