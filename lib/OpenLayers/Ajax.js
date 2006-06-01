
OpenLayers.ProxyHost = "/viewer/Crossbrowser/blindproxy.py?url=";
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
//    ol.Log.warn("Unhandled request return " + request.statusText);
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

        if (!params) {
            params="";
        }
        params += "&cachehack=" + new Date().getTime();
    }

//    ol.Log.debug("loadURL [" + uri + "]");

    var success = (onComplete) ? onComplete.bind(caller)
                                : OpenLayers.nullHandler;

    var failure = (onFailure) ? onFailure.bind(caller)
                           : OpenLayers.nullHandler;

    // from prototype.js
    new Ajax.Request(uri, 
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

    var ajaxResponse = Try.these(
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