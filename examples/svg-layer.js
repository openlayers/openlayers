import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/Layer.js';
import {composeCssTransform} from '../src/ol/transform.js';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    extent: [-180, -90, 180, 90],
    projection: 'EPSG:4326',
    zoom: 2
  })
});

const svgContainer = document.createElement('div');
const xhr = new XMLHttpRequest();
xhr.open('GET', 'data/world.svg');
xhr.addEventListener('load', function() {
  const svg = xhr.responseXML.documentElement;
  svgContainer.ownerDocument.importNode(svg);
  svgContainer.appendChild(svg);
});
xhr.send();

const width = 2560;
const height = 1280;
const svgResolution = 360 / width;
svgContainer.style.width = width + 'px';
svgContainer.style.height = height + 'px';
svgContainer.style.transformOrigin = 'top left';
svgContainer.className = 'svg-layer';

map.addLayer(new Layer({
  render: function(frameState) {
    const scale = svgResolution / frameState.viewState.resolution;
    const center = frameState.viewState.center;
    const size = frameState.size;
    const cssTransform = composeCssTransform(
      size[0] / 2, size[1] / 2,
      scale, scale,
      frameState.viewState.rotation,
      -center[0] / svgResolution - width / 2, center[1] / svgResolution - height / 2);
    svgContainer.style.transform = cssTransform;
    svgContainer.style.opacity = this.getOpacity();
    return svgContainer;
  }
}));
