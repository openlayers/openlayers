import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import Draw from 'ol/interaction/Draw';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Icon, Stroke, Style} from 'ol/style';

const raster = new TileLayer({
  source: new OSM()
});

const source = new VectorSource();

const styleFunction = function(feature) {
  const geometry = feature.getGeometry();
  const styles = [
    // linestring
    new Style({
      stroke: new Stroke({
        color: '#ffcc33',
        width: 2
      })
    })
  ];

  geometry.forEachSegment(function(start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(new Style({
      geometry: new Point(end),
      image: new Icon({
        src: 'data/arrow.png',
        anchor: [0.75, 0.5],
        rotateWithView: true,
        rotation: -rotation
      })
    }));
  });

  return styles;
};
const vector = new VectorLayer({
  source: source,
  style: styleFunction
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4
  })
});

map.addInteraction(new Draw({
  source: source,
  type: 'LineString'
}));
