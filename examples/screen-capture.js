import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Control from '../src/ol/control/Control.js';
import {defaults as defaultControls} from '../src/ol/control/defaults.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';

//
// Define the screen capture control.
//

const cameraIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
  '<circle cx="12" cy="13" r="4"/></svg>';

class ScreenCaptureControl extends Control {
  /**
   * @param {Object} [options] Control options.
   * @param {HTMLElement|string} [options.target] Specify a target if you want
   * the control to be rendered outside of the map's viewport.
   */
  constructor(options) {
    options = options || {};

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Capture the map';
    button.innerHTML = cameraIcon;

    const element = document.createElement('div');
    element.className = 'screen-capture ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    /**
     * The preview shown on top of the map after a capture.
     * @type {HTMLElement|null}
     * @private
     */
    this.preview_ = null;

    /**
     * Object URL of the captured image.
     * @type {string|null}
     * @private
     */
    this.imageUrl_ = null;

    button.addEventListener('click', this.handleCapture.bind(this), false);
  }

  /**
   * @param {import("../src/ol/Map.js").default|null} map Map.
   * @override
   */
  setMap(map) {
    this.closePreview_();
    super.setMap(map);
  }

  /**
   * Render the map into a canvas and show a preview.
   */
  handleCapture() {
    const map = this.getMap();
    const target = map.getTargetElement();
    const size = map.getSize();
    const canvas = document.createElement('canvas');
    canvas.width = size[0];
    canvas.height = size[1];

    map.once('rendercomplete', (event) => {
      const attributions = map
        .getAllLayers()
        .flatMap((layer) => layer.getAttributions(event.frameState));
      map.setTarget(target);
      map.render();
      Promise.all(attributions).then((resolved) => {
        drawAttributions(canvas, resolved);
        canvas.toBlob((blob) => this.showPreview_(blob, size), 'image/png');
      });
    });
    map.setTarget(canvas);
  }

  /**
   * @param {Blob} blob PNG image.
   * @param {import("../src/ol/size.js").Size} size Map size.
   * @private
   */
  showPreview_(blob, size) {
    this.closePreview_();
    this.imageUrl_ = URL.createObjectURL(blob);

    const image = document.createElement('img');
    image.src = this.imageUrl_;
    image.width = size[0] / 2;
    image.height = size[1] / 2;
    image.alt = 'Map capture preview';

    const download = document.createElement('button');
    download.type = 'button';
    download.textContent = 'Download picture';
    download.addEventListener('click', () => {
      this.download_(blob);
      this.closePreview_();
    });

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Return to map';
    cancel.addEventListener('click', () => this.closePreview_());

    const buttons = document.createElement('div');
    buttons.appendChild(download);
    buttons.appendChild(cancel);

    const preview = document.createElement('div');
    preview.className = 'screen-capture-preview';
    preview.appendChild(image);
    preview.appendChild(buttons);

    this.getMap().getOverlayContainerStopEvent().appendChild(preview);
    this.preview_ = preview;
  }

  /**
   * @private
   */
  closePreview_() {
    if (this.preview_) {
      this.preview_.remove();
      this.preview_ = null;
    }
    if (this.imageUrl_) {
      URL.revokeObjectURL(this.imageUrl_);
      this.imageUrl_ = null;
    }
  }

  /**
   * Save the image as a PNG file named after the current date and time.
   * @param {Blob} blob PNG image.
   * @private
   */
  download_(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'screencapture_' + timestamp() + '.png';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

/**
 * Draw the attributions in the lower right corner of the canvas.
 * @param {HTMLCanvasElement} canvas Canvas.
 * @param {Array<string>} attributions Attributions (may contain HTML).
 */
function drawAttributions(canvas, attributions) {
  const element = document.createElement('div');
  element.innerHTML = attributions.join(' ');
  const text = element.textContent.trim();
  if (!text) {
    return;
  }
  const context = canvas.getContext('2d');
  const padding = 4;
  context.font = '12px sans-serif';
  context.textBaseline = 'bottom';
  context.textAlign = 'right';
  const width = context.measureText(text).width + 2 * padding;
  const height = 12 + 2 * padding;
  context.fillStyle = 'rgba(255, 255, 255, 0.75)';
  context.fillRect(canvas.width - width, canvas.height - height, width, height);
  context.fillStyle = 'black';
  context.fillText(text, canvas.width - padding, canvas.height - padding);
}

/**
 * @return {string} The current local date and time as `YYYY-MM-DD_HH-MM-SS`.
 */
function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_` +
    `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  );
}

//
// Create the map, giving it a screen capture control.
//

const map = new Map({
  controls: defaultControls().extend([new ScreenCaptureControl()]),
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([80.7, 7.8]),
    zoom: 7,
  }),
});
