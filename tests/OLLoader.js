// Adding a mode parameter with "build" as value in the run-tests.html will 
// make usage of the build version of the library.
var regexS = "[\\?&]mode=([^&#]*)";
var regex = new RegExp( regexS );
var href = window.parent.location.href;
var url = href.substring(0, href.lastIndexOf('/') + 1);
var results = regex.exec( href );
url += (results && results[1] == 'build') ? 
    "../build/OpenLayers.js" : "../lib/OpenLayers.js"; 
scriptTag = "<script src='" + url + "'></script>"; 
document.write(scriptTag);
