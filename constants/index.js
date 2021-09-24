const {
  TRIBES,
  SKIN_COLORS,
  FUR_COLORS,
  EYE_COLORS,
  PUPIL_COLORS,
  HAIR,
  MOUTHS,
  BEARDS,
  TOPS,
  OUTERWEAR,
  PRINTS,
  BOTTOMS,
  FOOTWEAR,
  BELTS,
  HATS,
  EYEWEAR,
  PIERCINGS,
  WRISTS,
  HANDS,
  NECKWEAR,
  LEFT_ITEMS,
  RIGHT_ITEMS,
} = require('./traitNames');

const CONTRACT_METHODS = {
  PURCHASE: '0x72c9f580',
  RENAME: '0xc39cbef1',
};

const CHARACTER_BACKGROUNDS = ['Common', 'Rare', 'Meta', 'Legendary'];

const CHARACTER_TRAIT_TYPES = [
  'Tribe',
  'Skin Color',
  'Fur Color',
  'Eye Color',
  'Pupil Color',
  'Hair',
  'Mouth',
  'Beard',
  'Top',
  'Outerwear',
  'Print',
  'Bottom',
  'Footwear',
  'Belt',
  'Hat',
  'Eyewear',
  'Piercing',
  'Wrist',
  'Hands',
  'Neckwear',
  'Left Item',
  'Right Item',
];

const TRAIT_VALUE_MAP = {
  ...TRIBES,
  ...SKIN_COLORS,
  ...FUR_COLORS,
  ...EYE_COLORS,
  ...PUPIL_COLORS,
  ...HAIR,
  ...MOUTHS,
  ...BEARDS,
  ...TOPS,
  ...OUTERWEAR,
  ...PRINTS,
  ...BOTTOMS,
  ...FOOTWEAR,
  ...BELTS,
  ...HATS,
  ...EYEWEAR,
  ...PIERCINGS,
  ...WRISTS,
  ...HANDS,
  ...NECKWEAR,
  ...LEFT_ITEMS,
  ...RIGHT_ITEMS,
};

module.exports = {
  CONTRACT_METHODS,
  CHARACTER_BACKGROUNDS,
  CHARACTER_TRAIT_TYPES,
  TRAIT_VALUE_MAP,
};
