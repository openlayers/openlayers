let canvasCreator = function() {
  return document.createElement('canvas');
};

export function createCanvas() {
  return canvasCreator();
}

/**
 * @param {function() : HTMLCanvasElement} creator A creator function which instanciates a canvas
 */
export function setCanvasCreator(creator) {
  canvasCreator = creator;
}
