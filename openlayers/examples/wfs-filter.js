var map;

// use proxy if requesting features cross-domain
OpenLayers.ProxyHost= "proxy.cgi?url=";

function init() {

    map = new OpenLayers.Map({
        div: "map",
        layers: [
            new OpenLayers.Layer.WMS(
                "Natural Earth", 
                "http://demo.opengeo.org/geoserver/wms",
                {layers: "topp:naturalearth"}
            ),
            new OpenLayers.Layer.Vector("WFS", {
                strategies: [new OpenLayers.Strategy.BBOX()],
                protocol: new OpenLayers.Protocol.WFS({
                    url:  "http://demo.opengeo.org/geoserver/wfs",
                    featureType: "tasmania_roads",
                    featureNS: "http://www.openplans.org/topp"
                }),
                styleMap: new OpenLayers.StyleMap({
                    strokeWidth: 3,
                    strokeColor: "#333333"
                }),
                filter: new OpenLayers.Filter.Logical({
                    type: OpenLayers.Filter.Logical.OR,
                    filters: [
                        new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "TYPE",
                            value: "highway"
                        }),
                        new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: "TYPE",
                            value: "road"
                        })
                    ]
                })
            })
        ],
        center: new OpenLayers.LonLat(146.7, -41.8),
        zoom: 6
    });

}
