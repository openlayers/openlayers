var map, cacheWrite, cacheRead1, cacheRead2;
function init(){
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913",
        layers: [new OpenLayers.Layer.OSM("OpenStreetMap (CORS)", null, {
            eventListeners: {
                loadend: updateLayerInfo,
                tileloaded: updateTileInfo,
                tileerror: updateTileInfo
            }
        }),
        new OpenLayers.Layer.WMS("OSGeo (same origin - proxied)", "http://vmap0.tiles.osgeo.org/wms/vmap0", {
            layers: "basic"
        }, {
            eventListeners: {
                tileloadstart: function(evt) {
                    // send requests through proxy
                    evt.tile.url = "proxy.cgi?url=" + encodeURIComponent(evt.tile.url);
                },
                loadend: updateLayerInfo,
                tileloaded: updateTileInfo
            }
        })
        ],
        center: [0,0],
        zoom: 1
    });
    cacheWrite = new OpenLayers.Control.CacheWrite({
        imageFormat: "image/jpeg",
        eventListeners: {
            cachefull: function() {
                if (seeding) {
                    stopSeeding();
                }
                status.innerHTML = "Cache full.";
                cacheFull = true;
            }
        }
    });
    // try cache before loading from remote resource
    cacheRead1 = new OpenLayers.Control.CacheRead({
        eventListeners: {
            activate: function() {
                cacheRead2.deactivate();
            }
        }
    });
    // try loading from remote resource and fall back to cache
    cacheRead2 = new OpenLayers.Control.CacheRead({
        autoActivate: false,
        fetchEvent: "tileerror",
        eventListeners: {
            activate: function() {
                cacheRead1.deactivate();
            }
        }
    });
    var layerSwitcher = new OpenLayers.Control.LayerSwitcher();
    map.addControls([cacheWrite, cacheRead1, cacheRead2, layerSwitcher]);
    layerSwitcher.maximizeControl();


    
    // add UI and behavior
    var status = document.getElementById("status"),
        hits = document.getElementById("hits"),
        previousCount = -1,
        cacheHits = 0,
        cacheFull = false,
        seeding = false;
    updateLayerInfo();
    var read = document.getElementById("read");
    read.checked = true;
    read.onclick = toggleRead;
    var write = document.getElementById("write");
    write.checked = false;
    write.onclick = toggleWrite;
    document.getElementById("clear").onclick = clearCache;
    var tileloadstart = document.getElementById("tileloadstart");
    tileloadstart.checked = "checked";
    tileloadstart.onclick = setType;
    document.getElementById("tileerror").onclick = setType;
    document.getElementById("seed").onclick = startSeeding;

    // update the number of cached tiles and detect local storage support
    function updateLayerInfo(evt) {
        if (window.localStorage) {
            if (previousCount !== localStorage.length) {
                status.innerHTML = localStorage.length + " entries in cache.";
            }
            previousCount = localStorage.length;
        } else {
            status.innerHTML = "Local storage not supported. Try a different browser.";
        }
    }
    
    // update the number of cache hits and detect missing CORS support
    function updateTileInfo(evt) {
        if (cacheWrite.active) {
            try {
                var canvasContext = evt.tile.getCanvasContext();
                if (canvasContext) {
                    // will throw an exception if CORS image requests are not supported
                    canvasContext.canvas.toDataURL();
                } else {
                    status.innerHTML = "Canvas not supported. Try a different browser.";
                }
            } catch(e) {
                if (seeding) {
                    stopSeeding();
                }
                status.innerHTML = "CORS image requests not supported. Try a different layer.";
            }
        }
        if (evt.tile.url.substr(0, 5) === "data:") {
            cacheHits++;
        }
        hits.innerHTML = cacheHits + " cache hits.";
    }
    
    // turn the cacheRead controls on and off
    function toggleRead() {
        if (!this.checked) {
            cacheRead1.deactivate();
            cacheRead2.deactivate();
        } else {
            setType();
        }
    }
    
    // turn the cacheWrite control on and off
    function toggleWrite() {
        cacheWrite[cacheWrite.active ? "deactivate" : "activate"]();
    }
    
    // clear all tiles from the cache
    function clearCache() {
        OpenLayers.Control.CacheWrite.clearCache();
        cacheFull = false;
        updateLayerInfo();
    }
    
    // activate the cacheRead control that matches the desired fetch strategy
    function setType() {
        if (tileloadstart.checked) {
            cacheRead1.activate();
        } else {
            cacheRead2.activate();
        }
    }
    
    // start seeding the cache
    function startSeeding() {
        var layer = map.baseLayer,
            zoom = map.getZoom();
        seeding = {
            zoom: zoom,
            extent: map.getExtent(),
            center: map.getCenter(),
            cacheWriteActive: cacheWrite.active,
            buffer: layer.buffer,
            layer: layer
        };
        // make sure the next setCenter triggers a load
        map.zoomTo(zoom === layer.numZoomLevels-1 ? zoom - 1 : zoom + 1);
        // turn on cache writing
        cacheWrite.activate();
        // turn off cache reading
        cacheRead1.deactivate();
        cacheRead2.deactivate();
        
        layer.events.register("loadend", null, seed);
        
        // start seeding
        map.setCenter(seeding.center, zoom);
    }
    
    // seed a zoom level based on the extent at the time startSeeding was called
    function seed() {
        var layer = seeding.layer;
        var tileWidth = layer.tileSize.w;
        var nextZoom = map.getZoom() + 1;
        var extentWidth = seeding.extent.getWidth() / map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        map.zoomIn();
        if (cacheFull || nextZoom === layer.numZoomLevels-1) {
            stopSeeding();
        }
    }
    
    // stop seeding (when done or when cache is full)
    function stopSeeding() {
        // we're done - restore previous settings
        seeding.layer.events.unregister("loadend", null, seed);
        seeding.layer.buffer = seeding.buffer;
        map.setCenter(seeding.center, seeding.zoom);
        if (!seeding.cacheWriteActive) {
            cacheWrite.deactivate();
        }
        if (read.checked) {
            setType();
        }
        seeding = false;
    }
}