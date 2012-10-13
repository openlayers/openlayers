// Use proxy to get same origin URLs for tiles that don't support CORS.
OpenLayers.ProxyHost = "proxy.cgi?url=";

var map, cacheWrite;

function init() {
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913",
        layers: [
            new OpenLayers.Layer.WMS(
                "OSGeo", "http://vmap0.tiles.osgeo.org/wms/vmap0",
                {layers: "basic"}
            )
        ],
        center: [0, 0],
        zoom: 1
    });
    cacheWrite = new OpenLayers.Control.CacheWrite({
        autoActivate: true,
        imageFormat: "image/jpeg",
        eventListeners: {
            cachefull: function() { status.innerHTML = "Cache full."; }
        }
    });
    map.addControl(cacheWrite);



    // User interface
    var status = document.getElementById("status");
    document.getElementById("clear").onclick = function() {
        OpenLayers.Control.CacheWrite.clearCache();
        updateStatus();
    };

    // update the number of cached tiles and detect local storage support
    map.layers[0].events.on({'tileloaded': updateStatus});
    function updateStatus() {
        if (window.localStorage) {
            status.innerHTML = localStorage.length + " entries in cache.";
        } else {
            status.innerHTML = "Local storage not supported. Try a different browser.";
        }
    }
}