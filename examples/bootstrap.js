var map = new OpenLayers.Map({
    div: "map",
    projection: "EPSG:900913",
    layers: [
        new OpenLayers.Layer.XYZ(
            "Imagery",
            [
                "http://oatile1.mqcdn.com/naip/${z}/${x}/${y}.png",
                "http://oatile2.mqcdn.com/naip/${z}/${x}/${y}.png",
                "http://oatile3.mqcdn.com/naip/${z}/${x}/${y}.png",
                "http://oatile4.mqcdn.com/naip/${z}/${x}/${y}.png"
            ],
            {
                attribution: "Tiles Courtesy of <a href='http://open.mapquest.co.uk/' target='_blank'>MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency. <img src='http://developer.mapquest.com/content/osm/mq_logo.png' border='0'>",
                transitionEffect: "resize",
                wrapDateLine: true
            }
        )
    ],
    controls: [
        new OpenLayers.Control.Navigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.Zoom(),
        new OpenLayers.Control.Attribution()
    ],
    center: [0, 0],
    zoom: 1
});
