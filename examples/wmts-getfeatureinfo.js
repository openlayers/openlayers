OpenLayers.ProxyHost = "proxy.cgi?url=";
var map, control, popups = {};

function init() {
    
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913"
    });    
    
    var osm = new OpenLayers.Layer.OSM();

    // If tile matrix identifiers differ from zoom levels (0, 1, 2, ...)
    // then they must be explicitly provided.
    var matrixIds = new Array(26);
    for (var i=0; i<26; ++i) {
        matrixIds[i] = "EPSG:900913:" + i;
    }

    var zoning = new OpenLayers.Layer.WMTS({
        name: "zoning",
        url: "http://v2.suite.opengeo.org/geoserver/gwc/service/wmts/",
        layer: "medford:zoning",
        matrixSet: "EPSG:900913",
        matrixIds: matrixIds,
        format: "image/png",
        style: "_null",
        opacity: 0.7,
        isBaseLayer: false
    });
    var buildings = new OpenLayers.Layer.WMTS({
        name: "building",
        url: "http://v2.suite.opengeo.org/geoserver/gwc/service/wmts/",
        layer: "medford:buildings",
        matrixSet: "EPSG:900913",
        matrixIds: matrixIds,
        format: "image/png",
        style: "_null",
        isBaseLayer: false
    });

    map.addLayers([osm, zoning, buildings]);
    
    // create WMTS GetFeatureInfo control
    control = new OpenLayers.Control.WMTSGetFeatureInfo({
        drillDown: true,
        queryVisible: true,
        eventListeners: {
            getfeatureinfo: function(evt) {
                var text;
                var match = evt.text.match(/<body[^>]*>([\s\S]*)<\/body>/);
                if (match && !match[1].match(/^\s*$/)) {
                    text = match[1];
                } else {
                    text = "No " + evt.layer.name + " features in that area.<br>";
                }
                var popupId = evt.xy.x + "," + evt.xy.y;
                var popup = popups[popupId];
                if (!popup || !popup.map) {
                    popup = new OpenLayers.Popup.FramedCloud(
                        popupId, 
                        map.getLonLatFromPixel(evt.xy),
                        null,
                        " ",
                        null,
                        true,
                        function(evt) {
                            delete popups[this.id];
                            this.hide();
                            OpenLayers.Event.stop(evt);
                        }
                    );
                    popups[popupId] = popup;
                    map.addPopup(popup, true);
                }
                popup.setContentHTML(popup.contentHTML + text);
                popup.show();
            }
        }
    });
    map.addControl(control);
    control.activate();
    
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.setCenter(new OpenLayers.LonLat(-13678519, 5212803), 15);
    
    var drill = document.getElementById("drill");
    drill.checked = true;
    drill.onchange = function() {
        control.drillDown = drill.checked;
    };
}

OpenLayers.Popup.FramedCloud.prototype.maxSize = new OpenLayers.Size(350, 200);
