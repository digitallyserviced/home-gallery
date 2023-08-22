const { getEntryMetaByKey } = require('./utils')

const getMjMeta = (entry, minScore) => {
  const meta = getEntryMetaByKey(entry, 'mjmeta')
  if (!meta) {
    return []
  }
  // const { width, height, data } = meta
  return meta
  // return data
  //   .filter(object => object.score > minScore)
  //   .map(object => {
  //     return {
  //       x: +(object.bbox[0] / width).toFixed(3),
  //       y: +(object.bbox[1] / height).toFixed(3),
  //       width: +(object.bbox[2] / width).toFixed(2),
  //       height: +(object.bbox[3] / height).toFixed(2),
  //       score: +object.score.toFixed(2),
  //       class: object.class
  //     }
  //   })
}

module.exports = {
  getMjMeta
}

