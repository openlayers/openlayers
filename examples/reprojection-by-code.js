import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_OSM_ from '../src/ol/source/osm';
import _ol_source_TileImage_ from '../src/ol/source/tileimage';


var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
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
    map.setView(new _ol_View_({
      projection: 'EPSG:3857',
      center: [0, 0],
      zoom: 1
    }));
    return;
  }

  resultSpan.innerHTML = '(' + code + ') ' + name;

  var newProjCode = 'EPSG:' + code;
  proj4.defs(newProjCode, proj4def);
  var newProj = _ol_proj_.get(newProjCode);
  var fromLonLat = _ol_proj_.getTransform('EPSG:4326', newProj);

  // very approximate calculation of projection extent
  var extent = _ol_extent_.applyTransform(
      [bbox[1], bbox[2], bbox[3], bbox[0]], fromLonLat);
  newProj.setExtent(extent);
  var newView = new _ol_View_({
    projection: newProj
  });
  map.setView(newView);
  newView.fit(extent);
}


function search(query) {
  resultSpan.innerHTML = 'Searching ...';
  fetch('https://epsg.io/?format=json&q=' + query).then(function(response) {
    return response.json();
  }).then(function(json) {
    var results = json['results'];
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
    setProjection(null, null, null, null);
  });
}


/**
 * Handle click event.
 * @param {Event} event The event.
 */
searchButton.onclick = function(event) {
  search(queryInput.value);
  event.preventDefault();
};


/**
 * Handle change event.
 */
renderEdgesCheckbox.onchange = function() {
  map.getLayers().forEach(function(layer) {
    if (layer instanceof _ol_layer_Tile_) {
      var source = layer.getSource();
      if (source instanceof _ol_source_TileImage_) {
        source.setRenderReprojectionEdges(renderEdgesCheckbox.checked);
      }
    }
  });
};
