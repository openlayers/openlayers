import Draw from '../src/ol/interaction/Draw.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import View from '../src/ol/View.js';
import {Icon, Stroke, Style} from '../src/ol/style.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {get} from '../src/ol/proj.js';

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();

const styleFunction = function (feature) {
  const geometry = feature.getGeometry();
  const styles = [
    // linestring
    new Style({
      stroke: new Stroke({
        color: '#ffcc33',
        width: 2,
      }),
    }),
  ];

  geometry.forEachSegment(function (start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(
      new Style({
        geometry: new Point(end),
        image: new Icon({
          src: 'data/arrow.png',
          anchor: [0.75, 0.5],
          rotateWithView: true,
          rotation: -rotation,
        }),
      })
    );
  });

  return styles;
};
const vector = new VectorLayer({
  source: source,
  style: styleFunction,
});

// Limit multi-world panning to one world east and west of the real world.
// Geometry coordinates have to be within that range.
const extent = get('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
    extent,
  }),
});

map.addInteraction(
  new Draw({
    source: source,
    type: 'LineString',
  })
);
