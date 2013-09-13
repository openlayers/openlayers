var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      })
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  view: new ol.View2D({
    center: ol.proj.transform([-121.1, 47.5], 'EPSG:4326', 'EPSG:3857'),
    zoom: 7
  })
});
