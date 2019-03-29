import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {LineString, Point, Polygon} from '../src/ol/geom.js';
import {defaults as defaultInteractions, Pointer as PointerInteraction} from '../src/ol/interaction.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {TileJSON, Vector as VectorSource} from '../src/ol/source.js';
import {Fill, Icon, Stroke, Style} from '../src/ol/style.js';


class Drag extends PointerInteraction {
  constructor() {
    super({
      handleDownEvent: handleDownEvent,
      handleDragEvent: handleDragEvent,
      handleMoveEvent: handleMoveEvent,
      handleUpEvent: handleUpEvent
    });

    /**
     * @type {import("../src/ol/coordinate.js").Coordinate}
     * @private
     */
    this.coordinate_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.cursor_ = 'pointer';

    /**
     * @type {Feature}
     * @private
     */
    this.feature_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.previousCursor_ = undefined;
  }
}


/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
function handleDownEvent(evt) {
  const map = evt.map;

  const feature = map.forEachFeatureAtPixel(evt.pixel,
    function(feature) {
      return feature;
    });

  if (feature) {
    this.coordinate_ = evt.coordinate;
    this.feature_ = feature;
  }

  return !!feature;
}


/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Map browser event.
 */
function handleDragEvent(evt) {
  const deltaX = evt.coordinate[0] - this.coordinate_[0];
  const deltaY = evt.coordinate[1] - this.coordinate_[1];

  const geometry = this.feature_.getGeometry();
  geometry.translate(deltaX, deltaY);

  this.coordinate_[0] = evt.coordinate[0];
  this.coordinate_[1] = evt.coordinate[1];
}


/**
 * @param {import("../src/ol/MapBrowserEvent.js").default} evt Event.
 */
function handleMoveEvent(evt) {
  if (this.cursor_) {
    const map = evt.map;
    const feature = map.forEachFeatureAtPixel(evt.pixel,
      function(feature) {
        return feature;
      });
    const element = evt.map.getTargetElement();
    if (feature) {
      if (element.style.cursor != this.cursor_) {
        this.previousCursor_ = element.style.cursor;
        element.style.cursor = this.cursor_;
      }
    } else if (this.previousCursor_ !== undefined) {
      element.style.cursor = this.previousCursor_;
      this.previousCursor_ = undefined;
    }
  }
}


/**
 * @return {boolean} `false` to stop the drag sequence.
 */
function handleUpEvent() {
  this.coordinate_ = null;
  this.feature_ = null;
  return false;
}


const pointFeature = new Feature(new Point([0, 0]));

const lineFeature = new Feature(
  new LineString([[-1e7, 1e6], [-1e6, 3e6]]));

const polygonFeature = new Feature(
  new Polygon([[[-3e6, -1e6], [-3e6, 1e6],
    [-1e6, 1e6], [-1e6, -1e6], [-3e6, -1e6]]]));


const map = new Map({
  interactions: defaultInteractions().extend([new Drag()]),
  layers: [
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure'
      })
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [pointFeature, lineFeature, polygonFeature]
      }),
      style: new Style({
        image: new Icon({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          opacity: 0.95,
          src: 'data/icon.png'
        }),
        stroke: new Stroke({
          width: 3,
          color: [255, 0, 0, 1]
        }),
        fill: new Fill({
          color: [0, 0, 255, 0.6]
        })
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
