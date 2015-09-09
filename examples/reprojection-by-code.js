goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.MapQuest');
goog.require('ol.source.TileImage');



var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.MapQuest({layer: 'osm'})
    })
  ],
  renderer: common.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 1
  })
});


var queryInput = document.getElementById('epsg-query');
var searchButton = document.getElementById('epsg-search');
var resultSpan = document.getElementById('epsg-result');
var renderEdgesCheckbox = document.getElementById('render-edges');

function setProjection(code, name, proj4def, bbox) {
  if (code === null || name === null || proj4def === null || bbox === null) {
    resultSpan.innerHTML = 'Nothing usable found, using EPSG:3857...';
    map.setView(new ol.View({
      projection: 'EPSG:3857',
      center: [0, 0],
      zoom: 1
    }));
    return;
  }

  resultSpan.innerHTML = '(' + code + ') ' + name;

  var newProjCode = 'EPSG:' + code;
  proj4.defs(newProjCode, proj4def);
  var newProj = ol.proj.get(newProjCode);
  var fromLonLat = ol.proj.getTransform('EPSG:4326', newProj);

  // very approximate calculation of projection extent
  var extent = ol.extent.applyTransform(
      [bbox[1], bbox[2], bbox[3], bbox[0]], fromLonLat);
  newProj.setExtent(extent);
  var newView = new ol.View({
    projection: newProj
  });
  map.setView(newView);

  var size = map.getSize();
  if (size) {
    newView.fit(extent, size);
  }
}


function search(query) {
  resultSpan.innerHTML = 'Searching...';
  $.ajax({
    url: 'http://epsg.io/?format=json&q=' + query,
    dataType: 'jsonp',
    success: function(response) {
      if (response) {
        var results = response['results'];
        if (results && results.length > 0) {
          for (var i = 0, ii = results.length; i < ii; i++) {
            var result = results[i];
            if (result) {
              var code = result['code'], name = result['name'],
                  proj4def = result['proj4'], bbox = result['bbox'];
              if (code && code.length > 0 && proj4def && proj4def.length > 0 &&
                  bbox && bbox.length == 4) {
                setProjection(code, name, proj4def, bbox);
                return;
              }
            }
          }
        }
      }
      setProjection(null, null, null, null);
    }
  });
}


/**
 * @param {Event} e Change event.
 */
searchButton.onclick = function(e) {
  search(queryInput.value);
  e.preventDefault();
};


/**
 * @param {Event} e Change event.
 */
renderEdgesCheckbox.onchange = function(e) {
  map.getLayers().forEach(function(layer) {
    if (layer instanceof ol.layer.Tile) {
      var source = layer.getSource();
      if (source instanceof ol.source.TileImage) {
        source.setRenderReprojectionEdges(renderEdgesCheckbox.checked);
      }
    }
  });
};
