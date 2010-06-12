OpenLayers.ProxyHost = "/proxy/?url=";

var map, format;

function init() {
    
    format = new OpenLayers.Format.WMTSCapabilities();
    OpenLayers.Request.GET({
        url: "http://v2.suite.opengeo.org/geoserver/gwc/service/wmts",
        params: {
            SERVICE: "WMTS",
            VERSION: "1.0.0",
            REQUEST: "GetCapabilities"
        },
        success: function(request) {
            var doc = request.responseXML;
            if (!doc || !doc.documentElement) {
                doc = request.responseText;
            }
            var capabilities = format.read(doc);
            var layer = createLayer(capabilities, {
                layer: "medford:buildings",
                matrixSet: "EPSG:900913",
                format: "image/png",
                opacity: 0.7,
                isBaseLayer: false
            });
            map.addLayer(layer);
        }, 
        failure: function() {
            alert("Trouble getting capabilities doc");
            OpenLayers.Console.error.apply(OpenLayers.Console, arguments);
        }
    })
    
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913",
        units: "m",
        maxExtent: new OpenLayers.Bounds(
            -20037508.34, -20037508.34, 20037508.34, 20037508.34
        ),
        maxResolution: 156543.0339
    });    
    
    var osm = new OpenLayers.Layer.OSM();

    map.addLayer(osm);
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.setCenter(new OpenLayers.LonLat(-13677832, 5213272), 13);
    
}

function createLayer(capabilities, config) {

    var contents = capabilities.contents;
    var matrixSet = contents.tileMatrixSets[config.matrixSet];

    // find the layer definition with the given identifier
    var layers = contents.layers;
    var layer;
    for (var i=0, ii=layers.length; i<ii; ++i) {
        if (layers[i].identifier === config.layer) {
            layer = layers[i];
            break;
        }
    }

    // get the default style for the layer
    var style;
    for (var i=0, ii=layer.styles.length; i<ii; ++i) {
        style = layer.styles[i];
        if (style.isDefault === "true") { // TODO: change this to boolean
            break;
        }
    }

    // create the layer
    return new OpenLayers.Layer.WMTS(
        OpenLayers.Util.applyDefaults(config, {
            url: capabilities.operationsMetadata.GetTile.dcp.http.get,
            name: layer.title,
            style: style,
            matrixIds: matrixSet.matrixIds
        })
    );
    
}
