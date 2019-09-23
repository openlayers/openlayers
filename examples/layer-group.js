import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Group as LayerGroup, Tile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import TileJSON from '../src/ol/source/TileJSON.js';

const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2pzbmg0Nmk5MGF5NzQzbzRnbDNoeHJrbiJ9.7_-_gL8ur7ZtEiNwRfCy7Q';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }), new LayerGroup({
      layers: [
        new TileLayer({
          source: new TileJSON({
            url: 'https://api.tiles.mapbox.com/v4/mapbox.20110804-hoa-foodinsecurity-3month.json?secure&access_token=' + key,
            crossOrigin: 'anonymous'
          })
        }),
        new TileLayer({
          source: new TileJSON({
            url: 'https://api.tiles.mapbox.com/v4/mapbox.world-borders-light.json?secure&access_token=' + key,
            crossOrigin: 'anonymous'
          })
        })
      ]
    })
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([37.40570, 8.81566]),
    zoom: 4
  })
});

function bindInputs(layerid, layer) {
  const visibilityInput = $(layerid + ' input.visible');
  visibilityInput.on('change', function() {
    layer.setVisible(this.checked);
  });
  visibilityInput.prop('checked', layer.getVisible());

  const opacityInput = $(layerid + ' input.opacity');
  opacityInput.on('input change', function() {
    layer.setOpacity(parseFloat(this.value));
  });
  opacityInput.val(String(layer.getOpacity()));
}
map.getLayers().forEach(function(layer, i) {
  bindInputs('#layer' + i, layer);
  if (layer instanceof LayerGroup) {
    layer.getLayers().forEach(function(sublayer, j) {
      bindInputs('#layer' + i + j, sublayer);
    });
  }
});

$('#layertree li > span').click(function() {
  $(this).siblings('fieldset').toggle();
}).siblings('fieldset').hide();
