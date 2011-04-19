var map;

function init() {

    var mercator = new OpenLayers.Projection("EPSG:900913");
    var geographic = new OpenLayers.Projection("EPSG:4326");

    map = new OpenLayers.Map({
        div: "map",
        projection: mercator,
        layers: [
            new OpenLayers.Layer.OSM(),
            new OpenLayers.Layer.Vector("Aircraft Locations", {
                projection: geographic,
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP({
                    url: "kml-track.kml",
                    format: new OpenLayers.Format.KML({
                        extractTracks: true,
                        trackAttributes: ["speed"]
                    })
                }),
                styleMap: new OpenLayers.StyleMap({
                    "default": new OpenLayers.Style({
                        graphicName: "circle",
                        pointRadius: 2,
                        fillOpacity: 0.5,
                        fillColor: "#ffcc66",
                        strokeColor: "#666633",
                        strokeWidth: 1
                    })
                })
            })
        ],
        center: new OpenLayers.LonLat(-93.2735, 44.8349).transform(geographic, mercator),
        zoom: 8
    });
    
};

