import {createFillDisplacementCase} from '../fill-displacement-case.js';

export const name = 'webgpu-fill-displacement-zero';
export const setup = createFillDisplacementCase(name, [0, 0]);
