import {checkedFonts} from '../../../src/ol/render/canvas.js';

export function createFontStyle(options) {
  const src = Array.isArray(options.src) ? options.src : [options.src];
  function toCssSource(src) {
    const url = typeof src === 'string' ? src : src.url;
    const format = typeof src === 'string' ? undefined : src.format;
    return `url('${url}')${format ? ` format('${format}')` : ''}`;
  }
  const fontFamily = options.fontFamily;
  const fontStyle = options.fontStyle || 'normal';
  const fontWeight =
    options.fontWeight === undefined ? 400 : options.fontWeight;
  const fontFace = new FontFace(fontFamily, src.map(toCssSource).join(', '), {
    style: fontStyle,
    weight: fontWeight,
  });

  return {
    add() {
      document.fonts.add(fontFace);
    },
    remove() {
      document.fonts.delete(fontFace);
      checkedFonts.setProperties({}, true);
    },
  };
}
