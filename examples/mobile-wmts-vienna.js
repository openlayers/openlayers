var map;

(function() {
    // Set document language for css content 
    document.documentElement.lang = (navigator.userLanguage || navigator.language).split("-")[0];

    // A panel for switching between Aerial and Map, and for turning labels
    // on and off.
    var layerPanel = new OpenLayers.Control.Panel({
        displayClass: "layerPanel",
        autoActivate: true
    });
    var aerialButton = new OpenLayers.Control({
        type: OpenLayers.Control.TYPE_TOOL,
        displayClass: "aerialButton",
        eventListeners: {
            activate: function() {
                if (aerial) {map.setBaseLayer(aerial);}
            }
        }
    });
    var mapButton = new OpenLayers.Control({
        type: OpenLayers.Control.TYPE_TOOL,
        displayClass: "mapButton",
        eventListeners: {
            activate: function() {
                if (fmzk) {map.setBaseLayer(fmzk);}
            }
        }
    });
    var labelButton = new OpenLayers.Control({
        type: OpenLayers.Control.TYPE_TOGGLE,
        displayClass: "labelButton",
        eventListeners: {
            activate: function() {
                if (labels) {labels.setVisibility(true);}
            },
            deactivate: function() {
                if (labels) {labels.setVisibility(false);}
            }
        }
    });
    layerPanel.addControls([aerialButton, mapButton, labelButton]);
    
    var zoomPanel = new OpenLayers.Control.ZoomPanel();
    
    // Geolocate control for the Locate button - the locationupdated handler
    // draws a cross at the location and a circle showing the accuracy radius.
    zoomPanel.addControls([
        new OpenLayers.Control.Geolocate({
            type: OpenLayers.Control.TYPE_TOGGLE,
            geolocationOptions: {
                enableHighAccuracy: false,
                maximumAge: 0,
                timeout: 7000
            },
            eventListeners: {
                activate: function() {
                    map.addLayer(vector);
                },
                deactivate: function() {
                    map.removeLayer(vector);
                    vector.removeAllFeatures();
                },
                locationupdated: function(e) {
                    vector.removeAllFeatures();
                    vector.addFeatures([
                        new OpenLayers.Feature.Vector(e.point, null, {
                            graphicName: 'cross',
                            strokeColor: '#f00',
                            strokeWidth: 2,
                            fillOpacity: 0,
                            pointRadius: 10
                        }),
                        new OpenLayers.Feature.Vector(
                            OpenLayers.Geometry.Polygon.createRegularPolygon(
                                new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                                e.position.coords.accuracy / 2, 50, 0
                            ), null, {
                                fillOpacity: 0.1,
                                fillColor: '#000',
                                strokeColor: '#f00',
                                strokeOpacity: 0.6
                            }
                        )
                    ]);
                    map.zoomToExtent(vector.getDataExtent());
                }
            }
        })
    ]);

    // Map with navigation controls optimized for touch devices
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        projection: "EPSG:3857",
        units: "m",
        maxExtent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
        maxResolution: 156543.0339,
        numZoomLevels: 20,
        controls: [
            new OpenLayers.Control.Navigation({
                mouseWheelOptions: {
                    cumulative: false,
                    interval: 20
                },
                dragPanOptions: {
                    enableKinetic: {
                        deceleration: 0.02
                    }
                },
                zoomBoxEnabled: false
            }),
            new OpenLayers.Control.Attribution(),
            zoomPanel,
            layerPanel
        ],
        eventListeners: {
            moveend: function() {
                // update anchor for permalinks
                var ctr = map.getCenter();
                window.location.hash = "x="+ctr.lon+"&y="+ctr.lat+"&z="+map.getZoom();
            }
        }
    });
    layerPanel.activateControl(mapButton);
    layerPanel.activateControl(labelButton);

    // Vector layer for the location cross and circle
    var vector = new OpenLayers.Layer.Vector("Vector Layer");

    // The WMTS layers we're going to add
    var fmzk, aerial, labels;
    
    // zoom to initial extent or restore position from permalink
    function zoomToInitialExtent() {
        var extent = fmzk.tileFullExtent,
            ctr = extent.getCenterLonLat(),
            zoom = map.getZoomForExtent(extent, true),
            params = OpenLayers.Util.getParameters("?"+window.location.hash.substr(1));
        OpenLayers.Util.applyDefaults(params, {x:ctr.lon, y:ctr.lat, z:zoom});
        map.setCenter(new OpenLayers.LonLat(params.x, params.y), params.z);
    }

    // Request capabilities and create layers
    OpenLayers.ProxyHost = "proxy.cgi?url=";    
    OpenLayers.Request.GET({
        url: "http://maps.wien.gv.at/wmts/1.0.0/WMTSCapabilities.xml",
        success: function(request) {
            var format = new OpenLayers.Format.WMTSCapabilities();
            var defaults = {
                requestEncoding: "REST",
                matrixSet: "google3857",
                attribution: 'Datenquelle: Stadt Wien - <a href="http://data.wien.gv.at">data.wien.gv.at</a>'
            };
            var doc = request.responseText,
                caps = format.read(doc);
            fmzk = format.createLayer(caps, OpenLayers.Util.applyDefaults(
                {layer:"fmzk", requestEncoding:"REST", transitionEffect:"resize"}, defaults
            ));
            aerial = format.createLayer(caps, OpenLayers.Util.applyDefaults(
                {layer:"lb", requestEncoding:"REST", transitionEffect:"resize"}, defaults
            ));
            labels = format.createLayer(caps, OpenLayers.Util.applyDefaults(
                {layer:"beschriftung", requestEncoding:"REST", isBaseLayer: false},
                defaults
            ));
            map.addLayers([fmzk, aerial, labels]);
            zoomToInitialExtent();
        }
    });
    
    // Instead of building the layers from the capabilities document, we could
    // look at it ourselves and create the layers manually. If you want to try
    // that, uncomment the following code and remove the "Request capabilities
    // and create layers" block above.
    /*
    var extent = new OpenLayers.Bounds(1799448.394855, 6124949.74777, 1848250.442089, 6162571.828177);
    var defaults = {
        requestEncoding: "REST",
        matrixSet: "google3857",
        tileFullExtent: extent,
        attribution: 'Datenquelle: Stadt Wien - <a href="http://data.wien.gv.at">data.wien.gv.at</a>'
    };
    fmzk = new OpenLayers.Layer.WMTS(OpenLayers.Util.applyDefaults({
        url: "http://www.wien.gv.at/wmts/fmzk/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg",
        layer: "fmzk",
        style: "pastell",
        transitionEffect: "resize"
    },
    defaults));
    aerial = new OpenLayers.Layer.WMTS(OpenLayers.Util.applyDefaults({
        url: "http://www.wien.gv.at/wmts/lb/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg",
        layer: "lb",
        style: "farbe",
        transitionEffect: "resize"
    },
    defaults));
    labels = new OpenLayers.Layer.WMTS(OpenLayers.Util.applyDefaults({
        url: "http://www.wien.gv.at/wmts/beschriftung/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "beschriftung",
        style: "normal",
        transitionEffect: null,
        isBaseLayer: false
    },
    defaults));
    map.addLayers([fmzk, aerial, labels]);
    zoomToInitialExtent();
    */

})();

// Reliably hide the address bar on Android and iOS devices. From
// http://blog.nateps.com/how-to-hide-the-address-bar-in-a-full-screen
(function() {
    var page = document.getElementById("map"),
        ua = navigator.userAgent,
        iphone = ~ua.indexOf('iPhone') || ~ua.indexOf('iPod'),
        ipad = ~ua.indexOf('iPad'),
        ios = iphone || ipad,
        // Detect if this is running as a fullscreen app from the homescreen
        fullscreen = window.navigator.standalone,
        android = ~ua.indexOf('Android'),
        lastWidth = 0;

    if (android) {
        // Android's browser adds the scroll position to the innerHeight, just to
        // make this really fucking difficult. Thus, once we are scrolled, the
        // page height value needs to be corrected in case the page is loaded
        // when already scrolled down. The pageYOffset is of no use, since it always
        // returns 0 while the address bar is displayed.
        window.onscroll = function() {
            page.style.height = window.innerHeight + 'px';
        };
    }
    var setupScroll = window.onload = function() {
        // Start out by adding the height of the location bar to the width, so that
        // we can scroll past it
        if (ios) {
            // iOS reliably returns the innerWindow size for documentElement.clientHeight
            // but window.innerHeight is sometimes the wrong value after rotating
            // the orientation
            var height = document.documentElement.clientHeight;
            // Only add extra padding to the height on iphone / ipod, since the ipad
            // browser doesn't scroll off the location bar.
            if (iphone && !fullscreen) height += 60;
            page.style.height = height + 'px';
        } else if (android) {
            // The stock Android browser has a location bar height of 56 pixels, but
            // this very likely could be broken in other Android browsers.
            page.style.height = (window.innerHeight + 56) + 'px';
        }
        // Scroll after a timeout, since iOS will scroll to the top of the page
        // after it fires the onload event
        setTimeout(scrollTo, 0, 0, 1);
    };
    (window.onresize = function() {
        var pageWidth = page.offsetWidth;
        // Android doesn't support orientation change, so check for when the width
        // changes to figure out when the orientation changes
        if (lastWidth == pageWidth) return;
        lastWidth = pageWidth;
        setupScroll();
    })();
})();
