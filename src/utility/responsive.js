// utils/responsive.js
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 360;
const BASE_HEIGHT = 800;

export const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

export const verticalScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const responsiveFontSize = (size) =>
  Math.round(PixelRatio.roundToNearestPixel((size * SCREEN_WIDTH) / BASE_WIDTH));

export const responsiveHeight = (h) => (SCREEN_HEIGHT * h) / 100;
export const responsiveWidth = (w) => (SCREEN_WIDTH * w) / 100;