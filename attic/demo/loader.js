/**
    Adds the plovr generated script to the document.  The following default 
    values may be overridden with query string parameters:
    
     * hostname - localhost
     * port - 9810
     * mode - SIMPLE
     * id - ol
 */
(function() {
    var search = window.location.search.substring(1);
    var params = {
        hostname: "localhost",
        port: "9810",
        mode: "SIMPLE",
        id: "ol"
    };
    var chunks = search.split("&");
    var pair;
    for (var i=chunks.length-1; i>=0; --i) {
        pair = chunks[i].split("=");
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    
    var host = params.hostname + ":" + params.port;
    delete params.hostname;
    delete params.port;
    
    var pairs = [];
    for (var key in params) {
        pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
    }

    var url = "http://" + host + "/compile?" + pairs.join("&");
    document.write("<script type='text/javascript' src='" + url + "'></script>");
})();
