import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import OSM from '../../../../src/ol/source/OSM.js';

class OLComponent extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', 'theme/ol.css');
    this.shadow.appendChild(link);
    const style = document.createElement('style');
    style.innerText = `
      :host {
        display: block;
      }
      .ol-control {
        display: none;
      }
    `;
    this.shadow.appendChild(style);
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    this.shadow.appendChild(div);

    this.map = new Map({
      pixelRatio: 1,
      target: div,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
      }),
    });
  }
}

customElements.define('ol-map', OLComponent);

document.body.innerHTML =
  '<ol-map style="width: 256px; height: 128px"></ol-map>';

document.body.firstElementChild.style.height = '256px';

setTimeout(render, 1000);
