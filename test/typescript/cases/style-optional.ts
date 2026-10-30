import CircleStyle from '../../../build/ol/style/Circle.js';
import Icon from '../../../build/ol/style/Icon.js';
import ImageStyle from '../../../build/ol/style/Image.js';
import RegularShape from '../../../build/ol/style/RegularShape.js';
import Style from '../../../build/ol/style/Style.js';
import Text from '../../../build/ol/style/Text.js';

const icon = new Icon({
  src: 'shield.png',
  declutterMode: 'declutter',
  optional: false,
});
const text = new Text({text: '39', declutterMode: 'obstacle', optional: false});
export const style = new Style({image: icon, text});

const symbols: Array<ImageStyle | Text> = [
  icon,
  text,
  new CircleStyle({radius: 5, optional: true}),
  new RegularShape({points: 4, radius: 5, optional: false}),
];
for (const symbol of symbols) {
  const optional: boolean | undefined = symbol.clone().getOptional();
  symbol.setOptional(optional);
  symbol.setOptional(undefined);
}
