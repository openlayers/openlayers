/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * Namespace: OpenLayers.Request
 * The OpenLayers.Request namespace contains convenience methods for working
 *     with XMLHttpRequests.  These methods work with a cross-browser
 *     W3C compliant <OpenLayers.Request.XMLHttpRequest> class.
 */
OpenLayers.Request = {
    
    /**
     * Constant: DEFAULT_CONFIG
     * {Object} Default configuration for all requests.
     */
    DEFAULT_CONFIG: {
        method: "GET",
        url: window.location.href,
        async: true,
        user: undefined,
        password: undefined,
        params: null,
        proxy: OpenLayers.ProxyHost,
        headers: {},
        data: null,
        callback: function() {},
        success: null,
        failure: null,
        scope: null
    },
    
    /**
     * APIMethod: issue
     * Create a new XMLHttpRequest object, open it, set any headers, bind
     *     a callback to done state, and send any data.
     *
     * Parameters:
     * config - {Object} Object containing properties for configuring the
     *     request.  Allowed configuration properties are described below.
     *     This object is modified and should not be reused.
     *
     * Allowed config properties:
     * method - {String} One of GET, POST, PUT, DELETE, HEAD, or
     *     OPTIONS.  Default is GET.
     * url - {String} URL for the request.
     * async - {Boolean} Open an asynchronous request.  Default is true.
     * user - {String} User for relevant authentication scheme.  Set
     *     to null to clear current user.
     * password - {String} Password for relevant authentication scheme.
     *     Set to null to clear current password.
     * proxy - {String} Optional proxy.  Defaults to
     *     <OpenLayers.ProxyHost>.
     * params - {Object} Any key:value pairs to be appended to the
     *     url as a query string.  Assumes url doesn't already include a query
     *     string or hash.  Parameter values that are arrays will be
     *     concatenated with a comma (note that this goes against form-encoding)
     *     as is done with <OpenLayers.Util.getParameterString>.
     * headers - {Object} Object with header:value pairs to be set on
     *     the request.
     * data - {Object} Any data to send with the request.
     * callback - {Function} Function to call when request is done.
     *     To determine if the request failed, check request.status (200
     *     indicates success).
     * success - {Function} Optional function to call if request status is in
     *     the 200s.  This will be called in addition to callback above and
     *     would typically only be used as an alternative.
     * failure - {Function} Optional function to call if request status is not
     *     in the 200s.  This will be called in addition to callback above and
     *     would typically only be used as an alternative.
     * scope - {Object} If callback is a public method on some object,
     *     set the scope to that object.
     *
     * Returns:
     * {XMLHttpRequest} Request object.  To abort the request before a response
     *     is received, call abort() on the request object.
     */
    issue: function(config) {        
        // apply default config - proxy host may have changed
        var defaultConfig = OpenLayers.Util.extend(
            this.DEFAULT_CONFIG,
            {proxy: OpenLayers.ProxyHost}
        );
        config = OpenLayers.Util.applyDefaults(config, defaultConfig);

        // create request, open, and set headers
        var request = new OpenLayers.Request.XMLHttpRequest();
        var url = config.url;
        if(config.params) {
            url += "?" + OpenLayers.Util.getParameterString(config.params);
        }
        if(config.proxy && (url.indexOf("http") == 0)) {
            url = config.proxy + encodeURIComponent(url);
        }
        request.open(
            config.method, url, config.async, config.user, config.password
        );
        for(var header in config.headers) {
            request.setRequestHeader(header, config.headers[header]);
        }

        // bind callbacks to readyState 4 (done)
        var complete = (config.scope) ?
            OpenLayers.Function.bind(config.callback, config.scope) :
            config.callback;
        
        // optional success callback
        var success;
        if(config.success) {
            success = (config.scope) ?
                OpenLayers.Function.bind(config.success, config.scope) :
                config.success;
        }

        // optional failure callback
        var failure;
        if(config.failure) {
            failure = (config.scope) ?
                OpenLayers.Function.bind(config.failure, config.scope) :
                config.failure;
        }
         
        request.onreadystatechange = function() {
            if(request.readyState == OpenLayers.Request.XMLHttpRequest.DONE) {
                complete(request);
                if(success && request.status >= 200 && request.status < 300) {
                    success(request);
                }
                if(failure && (request.status < 200 || request.status >= 300)) {
                    failure(request);
                }
            }
        }
        
        // send request (optionally with data) and return
        request.send(config.data);
        return request;
    },
    
    /**
     * APIMethod: GET
     * Send an HTTP GET request.  Additional configuration properties are
     *     documented in the <issue> method, with the method property set
     *     to GET.
     *
     * Parameters:
     * config - {Object} Object with properties for configuring the request.
     *     See the <issue> method for documentation of allowed properties.
     *     This object is modified and should not be reused.
     * 
     * Returns:
     * {XMLHttpRequest} Request object.
     */
    GET: function(config) {
        config = OpenLayers.Util.extend(config, {method: "GET"});
        return OpenLayers.Request.issue(config);
    },
    
    /**
     * APIMethod: POST
     * Send a POST request.  Additional configuration properties are
     *     documented in the <issue> method, with the method property set
     *     to POST and "Content-Type" header set to "application/xml".
     *
     * Parameters:
     * config - {Object} Object with properties for configuring the request.
     *     See the <issue> method for documentation of allowed properties.  The
     *     default "Content-Type" header will be set to "application-xml" if
     *     none is provided.  This object is modified and should not be reused.
     * 
     * Returns:
     * {XMLHttpRequest} Request object.
     */
    POST: function(config) {
        config = OpenLayers.Util.extend(config, {method: "POST"});
        // set content type to application/xml if it isn't already set
        config.headers = config.headers ? config.headers : {};
        if(!("CONTENT-TYPE" in OpenLayers.Util.upperCaseObject(config.headers))) {
            config.headers["Content-Type"] = "application/xml";
        }
        return OpenLayers.Request.issue(config);
    },
    
    /**
     * APIMethod: PUT
     * Send an HTTP PUT request.  Additional configuration properties are
     *     documented in the <issue> method, with the method property set
     *     to PUT and "Content-Type" header set to "application/xml".
     *
     * Parameters:
     * config - {Object} Object with properties for configuring the request.
     *     See the <issue> method for documentation of allowed properties.  The
     *     default "Content-Type" header will be set to "application-xml" if
     *     none is provided.  This object is modified and should not be reused.
     * 
     * Returns:
     * {XMLHttpRequest} Request object.
     */
    PUT: function(config) {
        config = OpenLayers.Util.extend(config, {method: "PUT"});
        // set content type to application/xml if it isn't already set
        config.headers = config.headers ? config.headers : {};
        if(!("CONTENT-TYPE" in OpenLayers.Util.upperCaseObject(config.headers))) {
            config.headers["Content-Type"] = "application/xml";
        }
        return OpenLayers.Request.issue(config);
    },
    
    /**
     * APIMethod: DELETE
     * Send an HTTP DELETE request.  Additional configuration properties are
     *     documented in the <issue> method, with the method property set
     *     to DELETE.
     *
     * Parameters:
     * config - {Object} Object with properties for configuring the request.
     *     See the <issue> method for documentation of allowed properties.
     *     This object is modified and should not be reused.
     * 
     * Returns:
     * {XMLHttpRequest} Request object.
     */
    DELETE: function(config) {
        config = OpenLayers.Util.extend(config, {method: "DELETE"});
        return OpenLayers.Request.issue(config);
    },
  
    /**
     * APIMethod: HEAD
     * Send an HTTP HEAD request.  Additional configuration properties are
     *     documented in the <issue> method, with the method property set
     *     to HEAD.
     *
     * Parameters:
     * config - {Object} Object with properties for configuring the request.
     *     See the <issue> method for documentation of allowed properties.
     *     This object is modified and should not be reused.
     * 
     * Returns:
     * {XMLHttpRequest} Request object.
     */
    HEAD: function(config) {
        config = OpenLayers.Util.extend(config, {method: "HEAD"});
        return OpenLayers.Request.issue(config);
    },
    
    /**
     * APIMethod: OPTIONS
     * Send an HTTP OPTIONS request.  Additional configuration properties are
     *     documented in the <issue> method, with the method property set
     *     to OPTIONS.
     *
     * Parameters:
     * config - {Object} Object with properties for configuring the request.
     *     See the <issue> method for documentation of allowed properties.
     *     This object is modified and should not be reused.
     * 
     * Returns:
     * {XMLHttpRequest} Request object.
     */
    OPTIONS: function(config) {
        config = OpenLayers.Util.extend(config, {method: "OPTIONS"});
        return OpenLayers.Request.issue(config);
    }

};