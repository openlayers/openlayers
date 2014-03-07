var layers = [
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'Pixelmap 1:1000000 / geo.admin.ch</a>'
      })],
      crossOrigin: 'anonymous',
      params: {
        'LAYERS': 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
        'FORMAT': 'image/jpeg'
      },
      url: 'http://wms.geo.admin.ch/'
    })
  }),
  new ol.layer.Image({
    source: new ol.source.ImageWMS({
      attributions: [new ol.Attribution({
        html: '&copy; ' +
            '<a href="http://www.geo.admin.ch/internet/geoportal/' +
            'en/home.html">' +
            'National parks / geo.admin.ch</a>'
      })],
      crossOrigin: 'anonymous',
      params: {'LAYERS': 'ch.bafu.schutzgebiete-paerke_nationaler_bedeutung'},
      serverType: 'mapserver',
      url: 'http://wms.geo.admin.ch/'
    })
  })
];

// A minimal projection object is configured with only the SRS code and the map
// units. No client side coordinate transforms are possible with such a
// projection object.
var projection = new ol.proj.Projection({
  code: 'EPSG:21781',
  units: 'm'
});

var map = new ol.Map({
  layers: layers,
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [660000, 190000],
    projection: projection,
    zoom: 9
  })
});
