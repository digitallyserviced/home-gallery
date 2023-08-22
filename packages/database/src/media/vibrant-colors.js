const colorConvert = require("color-convert");

const { getEntryMetaByKey } = require("./utils");

const getVibrantColors = (entry) => {
  const vibrant = getEntryMetaByKey(entry, "vibrant");
  if (!vibrant) {
    return [];
  }
  const vColors = Object.entries(vibrant)
    .map(([type, vibrance], i, a) => ({ ...vibrance, type, hex: `#${colorConvert.rgb.hex(...vibrance.rgb)}` }))
    .filter((v) => !!v && v.population > 0).sort((a,b)=>a.population-b.population);
  vColors.reverse()
  return [vColors.slice(0,2).map(v => v.hex),vColors]
  //   const sortd = Object.values(vibrant).sort((a,b)=>a.population-b.population)
  //   return sortd
  //     .filter(v => !!v).sort((a,b)=>a.population-b.population)
  //     .map(rgb => `#${colorConvert.rgb.hex(...rgb)}`)
  // c
  // sortd.filter(v=>!!v).map(rgb=>`#${colorConvert.rgb.hex(...rgb.rgb)}`)
};

module.exports = {
  getVibrantColors,
};
