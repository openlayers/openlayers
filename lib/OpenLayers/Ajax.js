/* Copyright (c) 2006 MetaCarta, Inc., published under a modified BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/repository-license.txt 
 * for the full text of the license. */


OpenLayers.ProxyHost = "";
//OpenLayers.ProxyHost = "examples/proxy.cgi?url=";

/**
* Ajax reader for OpenLayers
*
*@uri url to do remote XML http get
*@param 'get' format params (x=y&a=b...)
*@who object to handle callbacks for this request
*@complete  the function to be called on success 
*@failure  the function to be called on failure
*
* example usage from a caller:
*
*   caps: function(request) {
*    -blah-  
*   },
*
*   OpenLayers.loadURL(url,params,this,caps);
*
* Notice the above example does not provide an error handler; a default empty
* handler is provided which merely logs the error if a failure handler is not 
* supplied
*
*/


/** 
* @param {} request
*/
OpenLayers.nullHandler = function(request) {
    alert("Unhandled request return " + request.statusText);
};

/** Background load a document
*
* @param {String} uri URI of source doc
* @param {String} params Params on get (doesnt seem to work)
* @param {Object} caller object which gets callbacks
* @param {Function} onComplete callback for success
* @param {Function} onFailure callback for failure
*
* Both callbacks optional (though silly)
*/
OpenLayers.loadURL = function(uri, params, caller,
                                  onComplete, onFailure) {

    if (OpenLayers.ProxyHost && uri.startsWith("http")) {
        uri = OpenLayers.ProxyHost + escape(uri);
    }

    var success = (onComplete) ? onComplete.bind(caller)
                                : OpenLayers.nullHandler;

    var failure = (onFailure) ? onFailure.bind(caller)
                           : OpenLayers.nullHandler;

    // from prototype.js
    new OpenLayers.Ajax.Request(uri, 
                     {   method: 'get', 
                         parameters: params,
                         onComplete: success, 
                         onFailure: failure
                      }
                     );
};

/** Parse XML into a doc structure
* @param {String} text
*
* @returns Parsed Ajax Response ??
* @type ?
*/
OpenLayers.parseXMLString = function(text) {

    //MS sucks, if the server is bad it dies
    var index = text.indexOf('<');
    if (index > 0) {
        text = text.substring(index);
    }

    var ajaxResponse = OpenLayers.Util.Try(
        function() {
            var xmldom = new ActiveXObject('Microsoft.XMLDOM');
            xmldom.loadXML(text);
            return xmldom;
        },
        function() {
            return new DOMParser().parseFromString(text, 'text/xml');
        },
        function() {
            var req = new XMLHttpRequest();
            req.open("GET", "data:" + "text/xml" +
                     ";charset=utf-8," + encodeURIComponent(text), false);
            if (req.overrideMimeType) {
                req.overrideMimeType("text/xml");
            }
            req.send(null);
            return req.responseXML;
        }
    );

    return ajaxResponse;
};

OpenLayers.Ajax = {
  emptyFunction: function () {},

  getTransport: function() {
    return OpenLayers.Util.Try(
      function() {return new ActiveXObject('Msxml2.XMLHTTP')},
      function() {return new ActiveXObject('Microsoft.XMLHTTP')},
      function() {return new XMLHttpRequest()}
    ) || false;
  },

  activeRequestCount: 0
};

OpenLayers.Ajax.Responders = {
  responders: [],

  register: function(responderToAdd) {
    for (var i = 0; i < this.responders.length; i++)
        if (responderToAdd == this.responders[i])
            return;
    this.responders.push(responderToAdd);
  },

  dispatch: function(callback, request, transport, json) {
    for (var i = 0; i < this.responders.length; i++) {
      responder = this.responders[i];
      if (responder[callback] && typeof responder[callback] == 'function') {
        try {
          responder[callback].apply(responder, [request, transport, json]);
        } catch (e) {}
      }
    }
  }
};

OpenLayers.Ajax.Responders.register({
  onCreate: function() {
    OpenLayers.Ajax.activeRequestCount++;
  },

  onComplete: function() {
    OpenLayers.Ajax.activeRequestCount--;
  }
});

OpenLayers.Ajax.Base = function() {};
OpenLayers.Ajax.Base.prototype = {
  setOptions: function(options) {
    this.options = {
      method:       'post',
      asynchronous: true,
      parameters:   ''
    }
    OpenLayers.Util.extend(this.options, options || {});
  },

  responseIsSuccess: function() {
    return this.transport.status == undefined
        || this.transport.status == 0
        || (this.transport.status >= 200 && this.transport.status < 300);
  },

  responseIsFailure: function() {
    return !this.responseIsSuccess();
  }
}

OpenLayers.Ajax.Request = OpenLayers.Class.create();
OpenLayers.Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];

OpenLayers.Ajax.Request.prototype = OpenLayers.Class.inherit( OpenLayers.Ajax.Base, {
  initialize: function(url, options) {
    this.transport = OpenLayers.Ajax.getTransport();
    this.setOptions(options);
    this.request(url);
  },

  request: function(url) {
    var parameters = this.options.parameters || '';
    if (parameters.length > 0) parameters += '&_=';

    try {
      this.url = url;
      if (this.options.method == 'get' && parameters.length > 0)
        this.url += (this.url.match(/\?/) ? '&' : '?') + parameters;

      OpenLayers.Ajax.Responders.dispatch('onCreate', this, this.transport);

      this.transport.open(this.options.method, this.url,
        this.options.asynchronous);

      if (this.options.asynchronous) {
        this.transport.onreadystatechange = this.onStateChange.bind(this);
        setTimeout((function() {this.respondToReadyState(1)}).bind(this), 10);
      }

      this.setRequestHeaders();

      var body = this.options.postBody ? this.options.postBody : parameters;
      this.transport.send(this.options.method == 'post' ? body : null);

      /* Force Firefox to handle ready state 4 for synchronous requests */
      if (!this.options.asynchronous && this.transport.overrideMimeType) {
          this.onStateChange();
      }

    } catch (e) {
      this.dispatchException(e);
    }
  },

  setRequestHeaders: function() {
    var requestHeaders =
      ['X-Requested-With', 'XMLHttpRequest',
       'X-Prototype-Version', 'OpenLayers'];

    if (this.options.method == 'post' && !this.options.postBody) {
      requestHeaders.push('Content-type',
        'application/x-www-form-urlencoded');

      /* Force "Connection: close" for Mozilla browsers to work around
       * a bug where XMLHttpReqeuest sends an incorrect Content-length
       * header. See Mozilla Bugzilla #246651.
       */
      if (this.transport.overrideMimeType)
        requestHeaders.push('Connection', 'close');
    }

    if (this.options.requestHeaders)
      requestHeaders.push.apply(requestHeaders, this.options.requestHeaders);

    for (var i = 0; i < requestHeaders.length; i += 2)
      this.transport.setRequestHeader(requestHeaders[i], requestHeaders[i+1]);
  },

  onStateChange: function() {
    var readyState = this.transport.readyState;
    if (readyState != 1)
      this.respondToReadyState(this.transport.readyState);
  },

  header: function(name) {
    try {
      return this.transport.getResponseHeader(name);
    } catch (e) {}
  },

  evalJSON: function() {
    try {
      return eval(this.header('X-JSON'));
    } catch (e) {}
  },

  evalResponse: function() {
    try {
      return eval(this.transport.responseText);
    } catch (e) {
      this.dispatchException(e);
    }
  },

  respondToReadyState: function(readyState) {
    var event = OpenLayers.Ajax.Request.Events[readyState];
    var transport = this.transport, json = this.evalJSON();

    if (event == 'Complete') {
      try {
        (this.options['on' + this.transport.status]
         || this.options['on' + (this.responseIsSuccess() ? 'Success' : 'Failure')]
         || OpenLayers.Ajax.emptyFunction)(transport, json);
      } catch (e) {
        this.dispatchException(e);
      }

      if ((this.header('Content-type') || '').match(/^text\/javascript/i))
        this.evalResponse();
    }

    try {
      (this.options['on' + event] || OpenLayers.Ajax.emptyFunction)(transport, json);
      OpenLayers.Ajax.Responders.dispatch('on' + event, this, transport, json);
    } catch (e) {
      this.dispatchException(e);
    }

    /* Avoid memory leak in MSIE: clean up the oncomplete event handler */
    if (event == 'Complete')
      this.transport.onreadystatechange = OpenLayers.Ajax.emptyFunction;
  },

  dispatchException: function(exception) {
    (this.options.onException || OpenLayers.Ajax.emptyFunction)(this, exception);
    OpenLayers.Ajax.Responders.dispatch('onException', this, exception);
  }
});

OpenLayers.Ajax.getElementsByTagNameNS  = function(parentnode, nsuri, nsprefix, tagname) {
    return parentnode.getElementsByTagNameNS ?
        parentnode.getElementsByTagNameNS(nsuri, tagname)
        : parentnode.getElementsByTagName(nsprefix + ':' + tagname);
}

/**
 * Wrapper function around XMLSerializer, which doesn't exist/work in
 * IE/Safari. We need to come up with a way to serialize in those browser:
 * for now, these browsers will just fail.
 * #535, #536
 *
 * @param {XMLNode} xmldom xml dom to serialize
 */
OpenLayers.Ajax.serializeXMLToString = function(xmldom) {
    var serializer = new XMLSerializer();
    data = serializer.serializeToString(xmldom);
    return data;
}
