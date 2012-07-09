/**
    Adds the plovr generated script to the document.
 */
(function() {
    var url = "http://" + window.location.hostname + ":9810/compile?id=ol";
    document.write("<script type='text/javascript' src='" + url + "'></script>");
})();
