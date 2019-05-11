import Typography from 'typography';
import theme from 'typography-theme-alton';

const typography = new Typography(theme);

export const baseSpacingPx = parseInt(theme.baseFontSize, 10);

export {theme};
export default typography;
