import {Circle, Fill, Style} from '../src/ol/style.js';
import {Feature, Map, Overlay, View} from '../src/ol/index.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Point} from '../src/ol/geom.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const place = [-110, 45];

const point = new Point(place);

const map = new Map({
  target: 'map',
  view: new View({
    center: place,
    zoom: 8,
  }),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [new Feature(point)],
      }),
      style: new Style({
        image: new Circle({
          radius: 9,
          fill: new Fill({color: 'red'}),
        }),
      }),
    }),
  ],
});

const element = document.getElementById('popup');

const popup = new Overlay({
  element: element,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -10],
});
map.addOverlay(popup);

function formatCoordinate(coordinate) {
  return `
    <table>
      <tbody>
        <tr><th>lon</th><td>${coordinate[0].toFixed(2)}</td></tr>
        <tr><th>lat</th><td>${coordinate[1].toFixed(2)}</td></tr>
      </tbody>
    </table>`;
}

const info = document.getElementById('info');
map.on('moveend', function () {
  const view = map.getView();
  const center = view.getCenter();
  info.innerHTML = formatCoordinate(center);
});

map.on('click', function (event) {
  const feature = map.getFeaturesAtPixel(event.pixel)[0];
  if (feature) {
    const coordinate = feature.getGeometry().getCoordinates();
    popup.setPosition(coordinate);
    $(element).popover({
      container: element.parentElement,
      html: true,
      sanitize: false,
      content: formatCoordinate(coordinate),
      placement: 'top',
    });
    $(element).popover('show');
  } else {
    $(element).popover('dispose');
  }
});

map.on('pointermove', function (event) {
  if (map.hasFeatureAtPixel(event.pixel)) {
    map.getViewport().style.cursor = 'pointer';
  } else {
    map.getViewport().style.cursor = 'inherit';
  }
});
