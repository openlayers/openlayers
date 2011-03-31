// initialize map when page ready
var map;


 
var init = function () {
    // create map
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        controls: [],
        layers: [
            new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                transitionEffect: 'resize'
            })
        ],
        center: new OpenLayers.LonLat(742000, 5861000),
        zoom: 3
    });
};
