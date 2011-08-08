// API key for http://openlayers.org. Please get your own at
// http://bingmapsportal.com/ and use that instead.
var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";

var map = new OpenLayers.Map('map', {
    controls: [
        new OpenLayers.Control.Attribution(),
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.LayerSwitcher()
    ]
});

var road3 = new OpenLayers.Layer.Bing({
    name: "Road tiles with 3 zoom levels",
    type: "Road",
    key: apiKey,
    maxResolution: 76.43702827453613,
    numZoomLevels: 3
});
var road5 = new OpenLayers.Layer.Bing({
    name: "Road tiles with 5 zoom levels",
    type: "Road",
    key: apiKey,
    numZoomLevels: 5
});
var road = new OpenLayers.Layer.Bing({
    name: "Road tiles with all zoom levels",
    type: "Road",
    key: apiKey
});

map.addLayers([road3, road5, road]);
map.setCenter(new OpenLayers.LonLat(-71.147, 42.472).transform(
    new OpenLayers.Projection("EPSG:4326"),
    map.getProjectionObject()
), 1);
