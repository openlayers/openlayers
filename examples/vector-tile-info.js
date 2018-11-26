import Map from 'ol/Map';
import View from 'ol/View';
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  }),
  layers: [new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      url: 'https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf'
    })
  })]
});

map.on('pointermove', showInfo);

const info = document.getElementById('info');
function showInfo(event) {
  const features = map.getFeaturesAtPixel(event.pixel);
  if (!features) {
    info.innerText = '';
    info.style.opacity = 0;
    return;
  }
  const properties = features[0].getProperties();
  info.innerText = JSON.stringify(properties, null, 2);
  info.style.opacity = 1;
}
