import ImageLayer from '../src/ol/layer/Image.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Raster as RasterSource, Stamen} from '../src/ol/source.js';

/**
 * Color manipulation functions below are adapted from
 * https://github.com/d3/d3-color.
 */
const Xn = 0.95047;
const Yn = 1;
const Zn = 1.08883;
const t0 = 4 / 29;
const t1 = 6 / 29;
const t2 = 3 * t1 * t1;
const t3 = t1 * t1 * t1;
const twoPi = 2 * Math.PI;

/**
 * Convert an RGB pixel into an HCL pixel.
 * @param {Array<number>} pixel A pixel in RGB space.
 * @return {Array<number>} A pixel in HCL space.
 */
function rgb2hcl(pixel) {
  const red = rgb2xyz(pixel[0]);
  const green = rgb2xyz(pixel[1]);
  const blue = rgb2xyz(pixel[2]);

  const x = xyz2lab(
    (0.4124564 * red + 0.3575761 * green + 0.1804375 * blue) / Xn
  );
  const y = xyz2lab(
    (0.2126729 * red + 0.7151522 * green + 0.072175 * blue) / Yn
  );
  const z = xyz2lab(
    (0.0193339 * red + 0.119192 * green + 0.9503041 * blue) / Zn
  );

  const l = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a);
  if (h < 0) {
    h += twoPi;
  }

  pixel[0] = h;
  pixel[1] = c;
  pixel[2] = l;

  return pixel;
}

/**
 * Convert an HCL pixel into an RGB pixel.
 * @param {Array<number>} pixel A pixel in HCL space.
 * @return {Array<number>} A pixel in RGB space.
 */
function hcl2rgb(pixel) {
  const h = pixel[0];
  const c = pixel[1];
  const l = pixel[2];

  const a = Math.cos(h) * c;
  const b = Math.sin(h) * c;

  let y = (l + 16) / 116;
  let x = isNaN(a) ? y : y + a / 500;
  let z = isNaN(b) ? y : y - b / 200;

  y = Yn * lab2xyz(y);
  x = Xn * lab2xyz(x);
  z = Zn * lab2xyz(z);

  pixel[0] = xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
  pixel[1] = xyz2rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z);
  pixel[2] = xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);

  return pixel;
}

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function xyz2rgb(x) {
  return (
    255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)
  );
}

const raster = new RasterSource({
  sources: [
    new Stamen({
      layer: 'watercolor',
    }),
  ],
  operation: function (pixels, data) {
    const hcl = rgb2hcl(pixels[0]);

    let h = hcl[0] + (Math.PI * data.hue) / 180;
    if (h < 0) {
      h += twoPi;
    } else if (h > twoPi) {
      h -= twoPi;
    }
    hcl[0] = h;

    hcl[1] *= data.chroma / 100;
    hcl[2] *= data.lightness / 100;

    return hcl2rgb(hcl);
  },
  lib: {
    rgb2hcl: rgb2hcl,
    hcl2rgb: hcl2rgb,
    rgb2xyz: rgb2xyz,
    lab2xyz: lab2xyz,
    xyz2lab: xyz2lab,
    xyz2rgb: xyz2rgb,
    Xn: Xn,
    Yn: Yn,
    Zn: Zn,
    t0: t0,
    t1: t1,
    t2: t2,
    t3: t3,
    twoPi: twoPi,
  },
});

const controls = {};

raster.on('beforeoperations', function (event) {
  const data = event.data;
  for (const id in controls) {
    data[id] = Number(controls[id].value);
  }
});

const map = new Map({
  layers: [
    new ImageLayer({
      source: raster,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 2500000],
    zoom: 2,
    maxZoom: 18,
  }),
});

const controlIds = ['hue', 'chroma', 'lightness'];
controlIds.forEach(function (id) {
  const control = document.getElementById(id);
  const output = document.getElementById(id + 'Out');
  control.addEventListener('input', function () {
    output.innerText = control.value;
    raster.changed();
  });
  output.innerText = control.value;
  controls[id] = control;
});
