export function overrideRAF() {
  const raf = window.requestAnimationFrame;
  const caf = window.cancelAnimationFrame;

  window.requestAnimationFrame = function (callback) {
    return setTimeout(callback, 1);
  };
  window.cancelAnimationFrame = function (key) {
    return clearTimeout(key);
  };

  return function () {
    window.requestAnimationFrame = raf;
    window.cancelAnimationFrame = caf;
  };
}

export function createFontStyle(options) {
  const styleNode = document.createElement('style');
  const src = Array.isArray(options.src) ? options.src : [options.src];
  function toCssSource(src) {
    const url = typeof src === 'string' ? src : src.url;
    const format = typeof src === 'string' ? undefined : src.format;
    return `url('${url}')${format ? ` format('${format}')` : ''}`;
  }
  const ruleText = `
    @font-face {
      font-family: '${options.fontFamily}';
      font-style: ${options.fontStyle || 'normal'};
      font-weight: ${
        options.fontWeight === undefined ? 400 : options.fontWeight
      };
      src: ${src.map(toCssSource).join(',\n  ')};
    }`;
  return {
    add() {
      document.head.appendChild(styleNode);
      if (styleNode.sheet.cssRules.length === 0) {
        styleNode.sheet.insertRule(ruleText);
      }
    },
    remove() {
      document.head.removeChild(styleNode);
    },
  };
}
