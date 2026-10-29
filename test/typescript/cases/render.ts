import Map from '../../../build/ol/Map.js';
import type {ToCanvasOptions} from '../../../build/ol/render.js';
import {toCanvas} from '../../../build/ol/render.js';

const map = new Map();
const options: ToCanvasOptions = {pixelRatio: 2, backgroundColor: 'white'};
export const canvas: HTMLCanvasElement = toCanvas(map, options);
export const defaultCanvas: HTMLCanvasElement = toCanvas(map);

// @ts-expect-error The output pixel ratio must be a number.
toCanvas(map, {pixelRatio: '2'});
