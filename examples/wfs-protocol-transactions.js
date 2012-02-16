var map, wfs;
OpenLayers.ProxyHost = "proxy.cgi?url=";

var DeleteFeature = OpenLayers.Class(OpenLayers.Control, {
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Feature(
            this, layer, {click: this.clickFeature}
        );
    },
    clickFeature: function(feature) {
        // if feature doesn't have a fid, destroy it
        if(feature.fid == undefined) {
            this.layer.destroyFeatures([feature]);
        } else {
            feature.state = OpenLayers.State.DELETE;
            this.layer.events.triggerEvent("afterfeaturemodified", 
                                           {feature: feature});
            feature.renderIntent = "select";
            this.layer.drawFeature(feature);
        }
    },
    setMap: function(map) {
        this.handler.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },
    CLASS_NAME: "OpenLayers.Control.DeleteFeature"
});

function init() {

    var extent = new OpenLayers.Bounds(
        -11593508, 5509847, -11505759, 5557774
    );


    map = new OpenLayers.Map('map', {
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        restrictedExtent: extent,
        controls: [
            new OpenLayers.Control.PanZoom(),
            new OpenLayers.Control.Navigation()
        ]
    });
    var gphy = new OpenLayers.Layer.Google(
        "Google Physical",
        {type: G_PHYSICAL_MAP, sphericalMercator: true}
    );

    var saveStrategy = new OpenLayers.Strategy.Save();
    
    wfs = new OpenLayers.Layer.Vector("Editable Features", {
        strategies: [new OpenLayers.Strategy.BBOX(), saveStrategy],
        projection: new OpenLayers.Projection("EPSG:4326"),
        protocol: new OpenLayers.Protocol.WFS({
            version: "1.1.0",
            srsName: "EPSG:4326",
            url: "http://demo.opengeo.org/geoserver/wfs",
            featureNS :  "http://opengeo.org",
            featureType: "restricted",
            geometryName: "the_geom",
            schema: "http://demo.opengeo.org/geoserver/wfs/DescribeFeatureType?version=1.1.0&typename=og:restricted"
        })
    }); 
   
    map.addLayers([gphy, wfs]);

    var panel = new OpenLayers.Control.Panel({
        displayClass: 'customEditingToolbar',
        allowDepress: true
    });
    
    var draw = new OpenLayers.Control.DrawFeature(
        wfs, OpenLayers.Handler.Polygon,
        {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolygon",
            multi: true
        }
    );
    
    var edit = new OpenLayers.Control.ModifyFeature(wfs, {
        title: "Modify Feature",
        displayClass: "olControlModifyFeature"
    });

    var del = new DeleteFeature(wfs, {title: "Delete Feature"});
   
    var save = new OpenLayers.Control.Button({
        title: "Save Changes",
        trigger: function() {
            if(edit.feature) {
                edit.selectControl.unselectAll();
            }
            saveStrategy.save();
        },
        displayClass: "olControlSaveFeatures"
    });

    panel.addControls([save, del, edit, draw]);
    map.addControl(panel);
    map.zoomToExtent(extent, true);
}

