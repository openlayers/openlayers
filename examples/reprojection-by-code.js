import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {applyTransform} from '../src/ol/extent.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {get as getProjection, getTransform} from '../src/ol/proj.js';
import {register} from '../src/ol/proj/proj4.js';
import OSM from '../src/ol/source/OSM.js';
import TileImage from '../src/ol/source/TileImage.js';
import proj4 from 'proj4';


const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 1
  })
});


const queryInput = document.getElementById('epsg-query');
const searchButton = document.getElementById('epsg-search');
const resultSpan = document.getElementById('epsg-result');
const renderEdgesCheckbox = document.getElementById('render-edges');

function setProjection(code, name, proj4def, bbox) {
  if (code === null || name === null || proj4def === null || bbox === null) {
    resultSpan.innerHTML = 'Nothing usable found, using EPSG:3857...';
    map.setView(new View({
      projection: 'EPSG:3857',
      center: [0, 0],
      zoom: 1
    }));
    return;
  }

  resultSpan.innerHTML = '(' + code + ') ' + name;

  const newProjCode = 'EPSG:' + code;
  proj4.defs(newProjCode, proj4def);
  register(proj4);
  const newProj = getProjection(newProjCode);
  const fromLonLat = getTransform('EPSG:4326', newProj);

  // very approximate calculation of projection extent
  const extent = applyTransform(
    [bbox[1], bbox[2], bbox[3], bbox[0]], fromLonLat);
  newProj.setExtent(extent);
  const newView = new View({
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
    const results = json['results'];
    if (results && results.length > 0) {
      for (let i = 0, ii = results.length; i < ii; i++) {
        const result = results[i];
        if (result) {
          const code = result['code'];
          const name = result['name'];
          const proj4def = result['proj4'];
          const bbox = result['bbox'];
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
    if (layer instanceof TileLayer) {
      const source = layer.getSource();
      if (source instanceof TileImage) {
        source.setRenderReprojectionEdges(renderEdgesCheckbox.checked);
      }
    }
  });
};
