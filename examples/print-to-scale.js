import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import WMTS, {optionsFromCapabilities} from '../src/ol/source/WMTS.js';
import WMTSCapabilities from '../src/ol/format/WMTSCapabilities.js';
import proj4 from 'proj4';
import {ScaleLine, defaults as defaultControls} from '../src/ol/control.js';
import {getPointResolution, get as getProjection} from '../src/ol/proj.js';
import {register} from '../src/ol/proj/proj4.js';

proj4.defs(
  'EPSG:27700',
  '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    '+units=m +no_defs'
);

register(proj4);

const proj27700 = getProjection('EPSG:27700');
proj27700.setExtent([0, 0, 700000, 1300000]);

const raster = new TileLayer();

const url =
  'https://tiles.arcgis.com/tiles/qHLhLQrcvEnxjtPr/arcgis/rest/services/OS_Open_Raster/MapServer/WMTS';
fetch(url)
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    const result = new WMTSCapabilities().read(text);
    const options = optionsFromCapabilities(result, {
      layer: 'OS_Open_Raster',
    });
    options.attributions =
      'Contains OS data © Crown Copyright and database right ' +
      new Date().getFullYear();
    options.crossOrigin = '';
    options.projection = proj27700;
    options.wrapX = false;
    raster.setSource(new WMTS(options));
  });

const map = new Map({
  layers: [raster],
  controls: defaultControls({
    attributionOptions: {collapsible: false},
  }),
  target: 'map',
  view: new View({
    center: [373500, 436500],
    projection: proj27700,
    zoom: 7,
  }),
});

const scaleLine = new ScaleLine({bar: true, text: true, minWidth: 125});
map.addControl(scaleLine);

const dims = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148],
};

// export options for html2canvase.
// See: https://html2canvas.hertzen.com/configuration
const exportOptions = {
  useCORS: true,
  ignoreElements: function (element) {
    const className = element.className || '';
    return (
      className.includes('ol-control') &&
      !className.includes('ol-scale') &&
      (!className.includes('ol-attribution') ||
        !className.includes('ol-uncollapsible'))
    );
  },
};

const exportButton = document.getElementById('export-pdf');

exportButton.addEventListener(
  'click',
  function () {
    exportButton.disabled = true;
    document.body.style.cursor = 'progress';

    const format = document.getElementById('format').value;
    const resolution = document.getElementById('resolution').value;
    const scale = document.getElementById('scale').value;
    const dim = dims[format];
    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const viewResolution = map.getView().getResolution();
    const scaleResolution =
      scale /
      getPointResolution(
        map.getView().getProjection(),
        resolution / 25.4,
        map.getView().getCenter()
      );

    map.once('rendercomplete', function () {
      exportOptions.width = width;
      exportOptions.height = height;
      html2canvas(map.getViewport(), exportOptions).then(function (canvas) {
        const pdf = new jspdf.jsPDF('landscape', undefined, format);
        pdf.addImage(
          canvas.toDataURL('image/jpeg'),
          'JPEG',
          0,
          0,
          dim[0],
          dim[1]
        );
        pdf.save('map.pdf');
        // Reset original map size
        scaleLine.setDpi();
        map.getTargetElement().style.width = '';
        map.getTargetElement().style.height = '';
        map.updateSize();
        map.getView().setResolution(viewResolution);
        exportButton.disabled = false;
        document.body.style.cursor = 'auto';
      });
    });

    // Set print size
    scaleLine.setDpi(resolution);
    map.getTargetElement().style.width = width + 'px';
    map.getTargetElement().style.height = height + 'px';
    map.updateSize();
    map.getView().setResolution(scaleResolution);
  },
  false
);
