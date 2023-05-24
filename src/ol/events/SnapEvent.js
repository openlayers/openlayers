import BaseEvent from './Event.js';

const SNAP = 'snap';
export class SnapEvent extends BaseEvent {
  constructor(options) {
    super(SNAP);
    this.vertex = options.vertex;
    this.vertexPixel = options.vertexPixel;
    this.feature = options.feature;
  }
}
