/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Protocol.js
 * @requires OpenLayers/Request/XMLHttpRequest.js
 */

/**
 * if application uses the query string, for example, for BBOX parameters,
 * OpenLayers/Format/QueryStringFilter.js should be included in the build config file
 */

/**
 * Class: OpenLayers.Protocol.HTTP
 * A basic HTTP protocol for vector layers.  Create a new instance with the
 *     <OpenLayers.Protocol.HTTP> constructor.
 *
 * Inherits from:
 *  - <OpenLayers.Protocol>
 */
OpenLayers.Protocol.HTTP = OpenLayers.Class(OpenLayers.Protocol, {

    /**
     * Property: url
     * {String} Service URL, read-only, set through the options
     *     passed to constructor.
     */
    url: null,

    /**
     * Property: headers
     * {Object} HTTP request headers, read-only, set through the options
     *     passed to the constructor,
     *     Example: {'Content-Type': 'plain/text'}
     */
    headers: null,

    /**
     * Property: params
     * {Object} Parameters of GET requests, read-only, set through the options
     *     passed to the constructor,
     *     Example: {'bbox': '5,5,5,5'}
     */
    params: null,
    
    /**
     * Property: callback
     * {Object} Function to be called when the <read>, <create>,
     *     <update>, <delete> or <commit> operation completes, read-only,
     *     set through the options passed to the constructor.
     */
    callback: null,

    /**
     * Property: scope
     * {Object} Callback execution scope, read-only, set through the
     *     options passed to the constructor.
     */
    scope: null,

    /**
     * APIProperty: readWithPOST
     * {Boolean} true if read operations are done with POST requests
     *     instead of GET, defaults to false.
     */
    readWithPOST: false,

    /**
     * APIProperty: updateWithPOST
     * {Boolean} true if update operations are done with POST requests
     *     defaults to false.
     */
    updateWithPOST: false,
    
    /**
     * APIProperty: deleteWithPOST
     * {Boolean} true if delete operations are done with POST requests
     *     defaults to false.
     *     if true, POST data is set to output of format.write().
     */
    deleteWithPOST: false,

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
     * Constructor: OpenLayers.Protocol.HTTP
     * A class for giving layers generic HTTP protocol.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     *
     * Valid options include:
     * url - {String}
     * headers - {Object} 
     * params - {Object} URL parameters for GET requests
     * format - {<OpenLayers.Format>}
     * callback - {Function}
     * scope - {Object}
     */
    initialize: function(options) {
        options = options || {};
        this.params = {};
        this.headers = {};
        OpenLayers.Protocol.prototype.initialize.apply(this, arguments);

        if (!this.filterToParams && OpenLayers.Format.QueryStringFilter) {
            var format = new OpenLayers.Format.QueryStringFilter({
                wildcarded: this.wildcarded,
                srsInBBOX: this.srsInBBOX
            });
            this.filterToParams = function(filter, params) {
                return format.write(filter, params);
            };
        }
    },
    
    /**
     * APIMethod: destroy
     * Clean up the protocol.
     */
    destroy: function() {
        this.params = null;
        this.headers = null;
        OpenLayers.Protocol.prototype.destroy.apply(this);
    },

    /**
     * APIMethod: filterToParams
     * Optional method to translate an <OpenLayers.Filter> object into an object
     *     that can be serialized as request query string provided.  If a custom
     *     method is not provided, the filter will be serialized using the 
     *     <OpenLayers.Format.QueryStringFilter> class.
     *
     * Parameters:
     * filter - {<OpenLayers.Filter>} filter to convert.
     * params - {Object} The parameters object.
     *
     * Returns:
     * {Object} The resulting parameters object.
     */
    
    /**
     * APIMethod: read
     * Construct a request for reading new features.
     *
     * Parameters:
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Valid options:
     * url - {String} Url for the request.
     * params - {Object} Parameters to get serialized as a query string.
     * headers - {Object} Headers to be set on the request.
     * filter - {<OpenLayers.Filter>} Filter to get serialized as a
     *     query string.
     * readWithPOST - {Boolean} If the request should be done with POST.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} A response object, whose "priv" property
     *     references the HTTP request, this object is also passed to the
     *     callback function when the request completes, its "features" property
     *     is then populated with the features received from the server.
     */
    read: function(options) {
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = options || {};
        options.params = OpenLayers.Util.applyDefaults(
            options.params, this.options.params);
        options = OpenLayers.Util.applyDefaults(options, this.options);
        if (options.filter && this.filterToParams) {
            options.params = this.filterToParams(
                options.filter, options.params
            );
        }
        var readWithPOST = (options.readWithPOST !== undefined) ?
                           options.readWithPOST : this.readWithPOST;
        var resp = new OpenLayers.Protocol.Response({requestType: "read"});
        if(readWithPOST) {
            var headers = options.headers || {};
            headers["Content-Type"] = "application/x-www-form-urlencoded";
            resp.priv = OpenLayers.Request.POST({
                url: options.url,
                callback: this.createCallback(this.handleRead, resp, options),
                data: OpenLayers.Util.getParameterString(options.params),
                headers: headers
            });
        } else {
            resp.priv = OpenLayers.Request.GET({
                url: options.url,
                callback: this.createCallback(this.handleRead, resp, options),
                params: options.params,
                headers: options.headers
            });
        }
        return resp;
    },

    /**
     * Method: handleRead
     * Individual callbacks are created for read, create and update, should
     *     a subclass need to override each one separately.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     the user callback.
     * options - {Object} The user options passed to the read call.
     */
    handleRead: function(resp, options) {
        this.handleResponse(resp, options);
    },

    /**
     * APIMethod: create
     * Construct a request for writing newly created features.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})} or
     *     {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *     object, whose "priv" property references the HTTP request, this 
     *     object is also passed to the callback function when the request
     *     completes, its "features" property is then populated with the
     *     the features received from the server.
     */
    create: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: features,
            requestType: "create"
        });

        resp.priv = OpenLayers.Request.POST({
            url: options.url,
            callback: this.createCallback(this.handleCreate, resp, options),
            headers: options.headers,
            data: this.format.write(features)
        });

        return resp;
    },

    /**
     * Method: handleCreate
     * Called the the request issued by <create> is complete.  May be overridden
     *     by subclasses.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the create call.
     */
    handleCreate: function(resp, options) {
        this.handleResponse(resp, options);
    },

    /**
     * APIMethod: update
     * Construct a request updating modified feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *     object, whose "priv" property references the HTTP request, this 
     *     object is also passed to the callback function when the request
     *     completes, its "features" property is then populated with the
     *     the feature received from the server.
     */
    update: function(feature, options) {
        options = options || {};
        var url = options.url ||
                  feature.url ||
                  this.options.url + "/" + feature.fid;
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: feature,
            requestType: "update"
        });

        var method = this.updateWithPOST ? "POST" : "PUT";
        resp.priv = OpenLayers.Request[method]({
            url: url,
            callback: this.createCallback(this.handleUpdate, resp, options),
            headers: options.headers,
            data: this.format.write(feature)
        });

        return resp;
    },

    /**
     * Method: handleUpdate
     * Called the the request issued by <update> is complete.  May be overridden
     *     by subclasses.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the update call.
     */
    handleUpdate: function(resp, options) {
        this.handleResponse(resp, options);
    },

    /**
     * APIMethod: delete
     * Construct a request deleting a removed feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     * options - {Object} Optional object for configuring the request.
     *     This object is modified and should not be reused.
     *
     * Returns:
     * {<OpenLayers.Protocol.Response>} An <OpenLayers.Protocol.Response>
     *     object, whose "priv" property references the HTTP request, this 
     *     object is also passed to the callback function when the request
     *     completes.
     */
    "delete": function(feature, options) {
        options = options || {};
        var url = options.url ||
                  feature.url ||
                  this.options.url + "/" + feature.fid;
        options = OpenLayers.Util.applyDefaults(options, this.options);

        var resp = new OpenLayers.Protocol.Response({
            reqFeatures: feature,
            requestType: "delete"
        });

        var method = this.deleteWithPOST ? "POST" : "DELETE";
        var requestOptions = {
            url: url,
            callback: this.createCallback(this.handleDelete, resp, options),
            headers: options.headers
        };
        if (this.deleteWithPOST) {
            requestOptions.data = this.format.write(feature);
        }
        resp.priv = OpenLayers.Request[method](requestOptions);

        return resp;
    },

    /**
     * Method: handleDelete
     * Called the the request issued by <delete> is complete.  May be overridden
     *     by subclasses.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the delete call.
     */
    handleDelete: function(resp, options) {
        this.handleResponse(resp, options);
    },

    /**
     * Method: handleResponse
     * Called by CRUD specific handlers.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>} The response object to pass to
     *     any user callback.
     * options - {Object} The user options passed to the create, read, update,
     *     or delete call.
     */
    handleResponse: function(resp, options) {
        var request = resp.priv;
        if(options.callback) {
            if(request.status >= 200 && request.status < 300) {
                // success
                if(resp.requestType != "delete") {
                    resp.features = this.parseFeatures(request);
                }
                resp.code = OpenLayers.Protocol.Response.SUCCESS;
            } else {
                // failure
                resp.code = OpenLayers.Protocol.Response.FAILURE;
            }
            options.callback.call(options.scope, resp);
        }
    },

    /**
     * Method: parseFeatures
     * Read HTTP response body and return features.
     *
     * Parameters:
     * request - {XMLHttpRequest} The request object
     *
     * Returns:
     * {Array({<OpenLayers.Feature.Vector>})} or
     *     {<OpenLayers.Feature.Vector>} Array of features or a single feature.
     */
    parseFeatures: function(request) {
        var doc = request.responseXML;
        if (!doc || !doc.documentElement) {
            doc = request.responseText;
        }
        if (!doc || doc.length <= 0) {
            return null;
        }
        return this.format.read(doc);
    },

    /**
     * APIMethod: commit
     * Iterate over each feature and take action based on the feature state.
     *     Possible actions are create, update and delete.
     *
     * Parameters:
     * features - {Array({<OpenLayers.Feature.Vector>})}
     * options - {Object} Optional object for setting up intermediate commit
     *     callbacks.
     *
     * Valid options:
     * create - {Object} Optional object to be passed to the <create> method.
     * update - {Object} Optional object to be passed to the <update> method.
     * delete - {Object} Optional object to be passed to the <delete> method.
     * callback - {Function} Optional function to be called when the commit
     *     is complete.
     * scope - {Object} Optional object to be set as the scope of the callback.
     *
     * Returns:
     * {Array(<OpenLayers.Protocol.Response>)} An array of response objects,
     *     one per request made to the server, each object's "priv" property
     *     references the corresponding HTTP request.
     */
    commit: function(features, options) {
        options = OpenLayers.Util.applyDefaults(options, this.options);
        var resp = [], nResponses = 0;
        
        // Divide up features before issuing any requests.  This properly
        // counts requests in the event that any responses come in before
        // all requests have been issued.
        var types = {};
        types[OpenLayers.State.INSERT] = [];
        types[OpenLayers.State.UPDATE] = [];
        types[OpenLayers.State.DELETE] = [];
        var feature, list, requestFeatures = [];
        for(var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            list = types[feature.state];
            if(list) {
                list.push(feature);
                requestFeatures.push(feature); 
            }
        }
        // tally up number of requests
        var nRequests = (types[OpenLayers.State.INSERT].length > 0 ? 1 : 0) +
            types[OpenLayers.State.UPDATE].length +
            types[OpenLayers.State.DELETE].length;
        
        // This response will be sent to the final callback after all the others
        // have been fired.
        var success = true;
        var finalResponse = new OpenLayers.Protocol.Response({
            reqFeatures: requestFeatures        
        });
        
        function insertCallback(response) {
            var len = response.features ? response.features.length : 0;
            var fids = new Array(len);
            for(var i=0; i<len; ++i) {
                fids[i] = response.features[i].fid;
            }   
            finalResponse.insertIds = fids;
            callback.apply(this, [response]);
        }
 
        function callback(response) {
            this.callUserCallback(response, options);
            success = success && response.success();
            nResponses++;
            if (nResponses >= nRequests) {
                if (options.callback) {
                    finalResponse.code = success ? 
                        OpenLayers.Protocol.Response.SUCCESS :
                        OpenLayers.Protocol.Response.FAILURE;
                    options.callback.apply(options.scope, [finalResponse]);
                }    
            }
        }

        // start issuing requests
        var queue = types[OpenLayers.State.INSERT];
        if(queue.length > 0) {
            resp.push(this.create(
                queue, OpenLayers.Util.applyDefaults(
                    {callback: insertCallback, scope: this}, options.create
                )
            ));
        }
        queue = types[OpenLayers.State.UPDATE];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this.update(
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: callback, scope: this}, options.update
                ))
            );
        }
        queue = types[OpenLayers.State.DELETE];
        for(var i=queue.length-1; i>=0; --i) {
            resp.push(this["delete"](
                queue[i], OpenLayers.Util.applyDefaults(
                    {callback: callback, scope: this}, options["delete"]
                ))
            );
        }
        return resp;
    },

    /**
     * APIMethod: abort
     * Abort an ongoing request, the response object passed to
     * this method must come from this HTTP protocol (as a result
     * of a create, read, update, delete or commit operation).
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>}
     */
    abort: function(response) {
        if (response) {
            response.priv.abort();
        }
    },

    /**
     * Method: callUserCallback
     * This method is used from within the commit method each time an
     *     an HTTP response is received from the server, it is responsible
     *     for calling the user-supplied callbacks.
     *
     * Parameters:
     * resp - {<OpenLayers.Protocol.Response>}
     * options - {Object} The map of options passed to the commit call.
     */
    callUserCallback: function(resp, options) {
        var opt = options[resp.requestType];
        if(opt && opt.callback) {
            opt.callback.call(opt.scope, resp);
        }
    },

    CLASS_NAME: "OpenLayers.Protocol.HTTP" 
});
