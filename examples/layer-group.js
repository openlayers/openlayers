import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import LayerGroup from '../src/ol/layer/Group.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import TileJSON from '../src/ol/source/TileJSON.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new LayerGroup({
      layers: [
        new TileLayer({
          source: new TileJSON({
            url:
              'https://api.tiles.mapbox.com/v4/mapbox.20110804-hoa-foodinsecurity-3month.json?secure&access_token=' +
              key,
            crossOrigin: 'anonymous',
          }),
        }),
        new TileLayer({
          source: new TileJSON({
            url:
              'https://api.tiles.mapbox.com/v4/mapbox.world-borders-light.json?secure&access_token=' +
              key,
            crossOrigin: 'anonymous',
          }),
        }),
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([37.4057, 8.81566]),
    zoom: 4,
  }),
});

function bindInputs(layerid, layer) {
  const visibilityInput = document.querySelector(layerid + ' input.visible');
  visibilityInput.addEventListener('change', function () {
    layer.setVisible(this.checked);
  });
  visibilityInput.addEventListener('change', function () {
    layer.setVisible(this.checked);
  });
  visibilityInput.checked = layer.getVisible();

  const opacityInput = document.querySelector(layerid + ' input.opacity');
  opacityInput.addEventListener('input', function () {
    layer.setOpacity(parseFloat(this.value));
  });
  opacityInput.value = String(layer.getOpacity());
}
function setup(id, group) {
  group.getLayers().forEach(function (layer, i) {
    const layerid = id + i;
    bindInputs(layerid, layer);
    if (layer instanceof LayerGroup) {
      setup(layerid, layer);
    }
  });
}
setup('#layer', map.getLayerGroup());

document.querySelectorAll('#layertree li > span').forEach(function (element) {
  element.addEventListener('click', function () {
    this.parentNode.querySelector('fieldset').style.display =
      this.parentNode.querySelector('fieldset').style.display === 'none'
        ? ''
        : 'none';
  });
  element.parentNode.querySelector('fieldset').style.display = 'none';
});
