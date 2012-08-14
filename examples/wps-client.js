OpenLayers.ProxyHost = 'proxy.cgi?url=';

var map, client, intersect, buffer;

function init() {
    
    map = new OpenLayers.Map('map', {
        allOverlays: true,
        center: [114, 16],
        zoom: 4,
        layers: [new OpenLayers.Layer.Vector()]
    });

    var features = [new OpenLayers.Feature.Vector(OpenLayers.Geometry.fromWKT(
        'LINESTRING(117 22,112 18,118 13, 115 8)'
    ))];
    var geometry = OpenLayers.Geometry.fromWKT(
        'POLYGON((110 20,120 20,120 10,110 10,110 20),(112 17,118 18,118 16,112 15,112 17))'
    );

    map.baseLayer.addFeatures(features);
    map.baseLayer.addFeatures([new OpenLayers.Feature.Vector(geometry)]);
    
    client = new OpenLayers.WPSClient({
        servers: {
            opengeo: 'http://demo.opengeo.org/geoserver/wps'
        }
    });
    
    // Create a process and configure it
    intersect = client.getProcess('opengeo', 'JTS:intersection');    
    intersect.configure({
        // spatial input can be a feature or a geometry or an array of
        // features or geometries
        inputs: {
            a: features,
            b: geometry
        }
    });
    
    // Create another process which chains the previous one and execute it
    buffer = client.getProcess('opengeo', 'JTS:buffer');
    buffer.execute({
        inputs: {
            geom: intersect.output(),
            distance: 1
        },
        success: function(outputs) {
            // outputs.result is a feature or an array of features for spatial
            // processes.
            map.baseLayer.addFeatures(outputs.result);
        }
    });

    // Instead of creating a process and executing it, we could call execute on
    // the client directly if we are only dealing with a single process:
    /*
    client.execute({
        server: "opengeo",
        process: "JTS:intersection",
        // spatial input can be a feature or a geometry or an array of
        // features or geometries
        inputs: {
            a: features,
            b: geometry
        },
        success: function(outputs) {
            // outputs.result is a feature or an array of features for spatial
            // processes.
            map.baseLayer.addFeatures(outputs.result);
        }
    });
    */

}