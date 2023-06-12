import BaseEvent from './Event.js';

export class SnapEvent extends BaseEvent {
  constructor(options) {
    super('snap');
    this.vertex = options.vertex;
    this.vertexPixel = options.vertexPixel;
    this.feature = options.feature;
  }
}
