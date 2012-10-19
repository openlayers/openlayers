// API key for http://openlayers.org. Please get your own at
// http://bingmapsportal.com/ and use that instead.
var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";

var hybrid = new OpenLayers.Layer.Bing({
    key: apiKey,
    type: "AerialWithLabels",
    name: "Bing Aerial With Labels"
});

var vector = new OpenLayers.Layer.Vector("GeoJSON", {
    projection: "EPSG:4326",
    strategies: [new OpenLayers.Strategy.Fixed()],
    protocol: new OpenLayers.Protocol.HTTP({
        url: "geojson-reprojected.json",
        format: new OpenLayers.Format.GeoJSON()
    })
});

var center = new OpenLayers.LonLat(-109.6, 46.7).transform("EPSG:4326", "EPSG:900913");

var map = new OpenLayers.Map({
    div: "map",
    layers: [hybrid, vector],
    center: center,
    zoom: 4
});
