var attribution = new ol.Attribution({
  html: 'Tiles &copy; <a href="http://maps.nls.uk/townplans/glasgow_1.html">' +
      'National Library of Scotland</a>'
});

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM({
        attributions: [
          new ol.Attribution({
            html: 'Tiles &copy; <a href="http://www.opencyclemap.org/">' +
                'OpenCycleMap</a>'
          }),
          ol.source.OSM.DATA_ATTRIBUTION
        ],
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    }),
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [attribution],
        url: 'http://geo.nls.uk/maps/towns/glasgow1857/{z}/{x}/{-y}.png'
      })
    })
  ],
  view: new ol.View2D({
    center: [-472202, 7530279],
    zoom: 12
  })
});
