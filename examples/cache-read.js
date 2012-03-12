var map, cacheRead;
function init() {
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913",
        layers: [
            new OpenLayers.Layer.WMS("OSGeo", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
                layers: "basic"
            }, {
                eventListeners: {
                    tileloaded: updateHits
                }
            })
        ],
        center: [0, 0],
        zoom: 1
    });
    cacheRead = new OpenLayers.Control.CacheRead();
    map.addControl(cacheRead);



    // User interface
    var status = document.getElementById("status"),
        hits = 0;

    // update the number of cached tiles and detect local storage support
    function updateHits(evt) {
        hits += evt.tile.url.substr(0, 5) === "data:";
        if (window.localStorage) {
            status.innerHTML = hits + " cache hits.";
        } else {
            status.innerHTML = "Local storage not supported. Try a different browser.";
        }
    }
}