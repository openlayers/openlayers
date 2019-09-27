
export function overrideRAF() {
  const raf = window.requestAnimationFrame;
  const caf = window.cancelAnimationFrame;

  window.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 1);
  };
  window.cancelAnimationFrame = function(key) {
    return clearTimeout(key);
  };

  return function() {
    window.requestAnimationFrame = raf;
    window.cancelAnimationFrame = caf;
  };
}
