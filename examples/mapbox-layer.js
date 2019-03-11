import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/Layer';
import {assign} from '../src/ol/obj';
import {getTransform} from '../src/ol/proj';
import SourceState from '../src/ol/source/State';
import {Stroke, Style} from '../src/ol/style.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';

class Mapbox extends Layer {

  /**
   * @param {import('./Base.js').Options} options Layer options.
   */
  constructor(options) {
    const baseOptions = assign({}, options);
    super(baseOptions);

    this.baseOptions = baseOptions;

    /**
     * @private
     * @type boolean
     */
    this.loaded = false;

    this.initMap();
  }

  initMap() {
    const map = this.map_;
    const view = map.getView();
    const transformToLatLng = getTransform(view.getProjection(), 'EPSG:4326');
    const center = transformToLatLng(view.getCenter());

    this.centerLastRender = view.getCenter();
    this.zoomLastRender = view.getZoom();
    this.centerLastRender = view.getCenter();
    this.zoomLastRender = view.getZoom();

    const options = assign(this.baseOptions, {
      attributionControl: false,
      boxZoom: false,
      center,
      container: map.getTargetElement(),
      doubleClickZoom: false,
      dragPan: false,
      dragRotate: false,
      interactive: false,
      keyboard: false,
      pitchWithRotate: false,
      scrollZoom: false,
      touchZoomRotate: false,
      zoom: view.getZoom() - 1
    });

    this.mbmap = new mapboxgl.Map(options);
    this.mbmap.on('load', function() {
      this.mbmap.getCanvas().remove();
      this.loaded = true;
      this.map_.render();
      [
        'mapboxgl-control-container'
      ].forEach(className => document.getElementsByClassName(className)[0].remove());
    }.bind(this));

    this.mbmap.on('render', function() {
      // Reset offset
      if (this.centerNextRender) {
        this.centerLastRender = this.centerNextRender;
      }
      if (this.zoomNextRender) {
        this.zoomLastRender = this.zoomNextRender;
      }
      this.updateRenderedPosition([0, 0], 1);
    }.bind(this));

  }

  /**
   *
   * @inheritDoc
   */
  render(frameState) {
    const map = this.map_;
    const view = map.getView();
    const transformToLatLng = getTransform(view.getProjection(), 'EPSG:4326');

    this.centerNextRender = view.getCenter();
    const lastRender = map.getPixelFromCoordinate(this.centerLastRender);
    const nextRender = map.getPixelFromCoordinate(this.centerNextRender);
    const centerOffset = [lastRender[0] - nextRender[0], lastRender[1] - nextRender[1]];
    this.zoomNextRender = view.getZoom();
    const zoomOffset = Math.pow(2, this.zoomNextRender - this.zoomLastRender);
    this.updateRenderedPosition(centerOffset, zoomOffset);

    const rotation = frameState.viewState.rotation;
    if (rotation) {
      this.mbmap.rotateTo(-rotation * 180 / Math.PI, {
        animate: false
      });
    }

    // Re-render mbmap
    const center = transformToLatLng(this.centerNextRender);
    const zoom = view.getZoom() - 1;
    this.mbmap.jumpTo({
      center: center,
      zoom: zoom
    });
    return this.mbmap.getCanvas();
  }

  updateRenderedPosition(centerOffset, zoomOffset) {
    const style = this.mbmap.getCanvas().style;
    style.left = Math.round(centerOffset[0]) + 'px';
    style.top = Math.round(centerOffset[1]) + 'px';
    style.transform = 'scale(' + zoomOffset + ')';
  }

  setVisible(visible) {
    super.setVisible(visible);

    const canvas = this.mbmap.getCanvas();
    canvas.style.display = visible ? 'block' : 'none';
  }

  setOpacity(opacity) {
    super.setOpacity(opacity);
    const canvas = this.mbmap.getCanvas();
    canvas.style.opacity = opacity;
  }

  setZIndex(zindex) {
    super.setZIndex(zindex);
    const canvas = this.mbmap.getCanvas();
    canvas.style.zIndex = zindex;
  }

  /**
   * @inheritDoc
   */
  getSourceState() {
    return this.loaded ? SourceState.READY : SourceState.UNDEFINED;
  }

  setMap(map) {
    this.map_ = map;
  }

}

mapboxgl.Map.prototype._setupContainer = function _setupContainer() {
  const container = this._container;
  container.classList.add('mapboxgl-map');

  const canvasContainer = this._canvasContainer = container.firstChild;

  this._canvas = document.createElement('canvas');
  canvasContainer.insertBefore(this._canvas, canvasContainer.firstChild);
  this._canvas.style.position = 'absolute';
  this._canvas.addEventListener('webglcontextlost', this._contextLost, false);
  this._canvas.addEventListener('webglcontextrestored', this._contextRestored, false);
  this._canvas.setAttribute('tabindex', '0');
  this._canvas.setAttribute('aria-label', 'Map');
  this._canvas.className = 'mapboxgl-canvas';

  const dimensions = this._containerDimensions();
  this._resizeCanvas(dimensions[0], dimensions[1]);

  this._controlContainer = canvasContainer;
  const controlContainer = this._controlContainer = document.createElement('div');
  controlContainer.className = 'mapboxgl-control-container';
  container.appendChild(controlContainer);

  const positions = this._controlPositions = {};
  ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(function(positionName) {
    const elem = document.createElement('div');
    elem.className = 'mapboxgl-ctrl-' + positionName;
    controlContainer.appendChild(elem);
    positions[positionName] = elem;
  });
};

const style = new Style({
  stroke: new Stroke({
    color: '#319FD3',
    width: 2
  })
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  }),
  style: style
});

const map = new Map({
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
    minZoom: 1,
    extent: [-Infinity, -20048966.10, Infinity, 20048966.10],
    smoothExtentConstraint: false,
    smoothResolutionConstraint: false
  })
});

const key = 'ER67WIiPdCQvhgsUjoWK';
const mbLayer = new Mapbox({
  map: map,
  container: map.getTarget(),
  style: 'https://maps.tilehosting.com/styles/bright/style.json?key=' + key
});

map.addLayer(mbLayer);
map.addLayer(vectorLayer);
