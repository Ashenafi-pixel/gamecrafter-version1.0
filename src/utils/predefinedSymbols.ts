import wildImg from '../assets/symbols/wild.png';
import scatterImg from '../assets/symbols/scatter.png';
import high1Img from '../assets/symbols/high_1.png';
import high2Img from '../assets/symbols/high_2.png';
import high3Img from '../assets/symbols/high_3.png';
import high4Img from '../assets/symbols/high_4.png';
import medium1Img from '../assets/symbols/mid_1.png';
import medium2Img from '../assets/symbols/mid_2.png';
import medium3Img from '../assets/symbols/mid_3.png';
import medium4Img from '../assets/symbols/mid_4.png';
import low1Img from '../assets/symbols/low_1.png';
import low2Img from '../assets/symbols/low_2.png';
import low3Img from '../assets/symbols/low_3.png';
import low4Img from '../assets/symbols/low_4.png';

export const PREDEFINED_SYMBOLS = {
  wild: wildImg,
  wild2: wildImg, 
  scatter: scatterImg,
  high1: high1Img,
  high2: high2Img,
  high3: high3Img,
  high4: high4Img,
  medium1: medium1Img,
  medium2: medium2Img,
  medium3: medium3Img,
  medium4: medium4Img,
  low1: low1Img,
  low2: low2Img,
  low3: low3Img,
  low4: low4Img, 
};

// Default Classic preset symbols for store initialization
export const DEFAULT_CLASSIC_SYMBOLS = {
  wild: wildImg,
  high1: high1Img,
  high2: high2Img,
  high3: high3Img,
  medium1: medium1Img,
  medium2: medium2Img,
  low1: low1Img,
  low2: low2Img
};

export const initializePredefinedSymbols = () => {
  return PREDEFINED_SYMBOLS;
};