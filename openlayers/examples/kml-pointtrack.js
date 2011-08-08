var map;

function init() {

    var mercator = new OpenLayers.Projection("EPSG:900913");
    var geographic = new OpenLayers.Projection("EPSG:4326");

    map = new OpenLayers.Map({
        div: "map",
        projection: mercator,
        layers: [
            new OpenLayers.Layer.OSM(),
            new OpenLayers.Layer.PointTrack("Aircraft Tracks", {
                projection: geographic,
                strategies: [new OpenLayers.Strategy.Fixed()],
                protocol: new OpenLayers.Protocol.HTTP({
                    url: "kml-track.kml",
                    format: new OpenLayers.Format.KML({
                        extractTracks: true,
                        extractStyles: true
                    })
                }),
                dataFrom: OpenLayers.Layer.PointTrack.TARGET_NODE,
                styleFrom: OpenLayers.Layer.PointTrack.TARGET_NODE,
                eventListeners: {
                    "beforefeaturesadded": function(e) {
                        // group the tracks by fid and create one track for
                        // every fid
                        var fid, points = [], feature;
                        for (var i=0, len=e.features.length; i<len; i++) {
                            feature = e.features[i];
                            if (feature.fid !== fid || i === len-1) {
                                fid = feature.fid;
                                this.addNodes(points, {silent: true});
                                points = [];
                            }
                            points.push(feature);
                        }
                        return false;
                    }
                }
            })
        ],
        center: new OpenLayers.LonLat(-93.2735, 44.8349).transform(geographic, mercator),
        zoom: 8
    });

    map.addControl(new OpenLayers.Control.LayerSwitcher());
    
};

