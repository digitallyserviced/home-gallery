import { Entry } from '../entry'

export const cosineSimilarity = (a, b) => {
  let denA = 0
  let denB = 0
  let num = 0
  for (let i = 0; i < a.length; i++) {
    let ai = a.charCodeAt(i) & 255
    let bi = b.charCodeAt(i) & 255
    for (let j = 0; j < 4; j++) {
      let av = (ai & 3)
      let bv = (bi & 3)
      av = av * av / 9
      bv = bv * bv / 9
      num += av * bv
      denA += av * av
      denB += bv * bv

      ai = (ai >> 2)
      bi = (bi >> 2)
    }
  }

  return num / (Math.sqrt(denA) * Math.sqrt(denB))
}
function getSimilarity(arr1, arr2) {
  let similaritySum = 0;
  let populationSum = 0;
  for (let i = 0; i < Math.min(arr1.length,arr2.length); i++) {
    let color1 = arr1[i];
    let color2 = arr2[i];
    let hsv1 = rgbToHsv(color1.rgb);
    let hsv2 = rgbToHsv(color2.rgb);
    let similarity = Math.sqrt(Math.pow(hsv2[0] - hsv1[0], 2) + Math.pow(hsv2[1] - hsv1[1], 2) + Math.pow(hsv2[2] - hsv1[2], 2));
    similarity *= color1.population;
    populationSum += color1.population;
    similaritySum += similarity;
  }

  return similaritySum/populationSum;
}
/*function rgbToHsv*/
function rgbToHsv(rgb){
  var r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h, s, v;

    if (max == min)
        h = 0;
    else if (r == max)
        h = (g - b) / delta;
    else if (g == max)
        h = 2 + (b - r) / delta;
    else if (b == max)
        h = 4 + (r - g) / delta;

    h = Math.min(h * 60, 360);

    if (h < 0)
        h += 360;

    v = max;
    s = (max === 0) ? 0 : delta / max;

    return [ Math.round(h) , Math.round(s * 100) , Math.round(v * 100)];
}
export const execVibrantDistance = (entries: Entry[], srcVibrant, threshold=0.67) => {
  if (!srcVibrant) {
    return entries
  }
  const t0 = Date.now()
  const comparableEntries = entries.filter(entry => !!entry.vibrance)
  const t1 = Date.now()
  // const f = threshold || 0.73
  const similar = comparableEntries.map(entry => {
    entry.colorDistance=getSimilarity(srcVibrant, entry.vibrance)
    entry.overlayText=`${(entry.colorDistance).toFixed(2)}`
    return entry
  })
  // .filter(item => item.similarity > 0.4)
  const t2 = Date.now()
  similar.sort((a, b) => a.colorDistance - b.colorDistance)
  const result = similar.map(s => s)
  const t3 = Date.now()
  console.log(`Similarity search: Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms`)
  return result
}
export const execSimilar = (entries: Entry[], similarityHash, threshold=0.67) => {
  if (!similarityHash) {
    return entries
  }
  const t0 = Date.now()
  const comparableEntries = entries.filter(entry => !!entry.similarityHash)
  const t1 = Date.now()
  // const f = threshold || 0.73
  const similar = comparableEntries.map(entry => {
    entry.similarity=cosineSimilarity(similarityHash, entry.similarityHash)
    entry.overlayText=`${(entry.similarity*100).toFixed(2)}%`
    return entry
  })
  .filter(item => item.similarity > 0.4)
  const t2 = Date.now()
  similar.sort((a, b) => a.similarity < b.similarity)
  const result = similar.map(s => s)
  const t3 = Date.now()
  console.log(`Similarity search: Took ${t1 - t0}ms to select, ${t2 - t1}ms to calculate, to sort ${t3 - t2}ms, to map ${Date.now() - t3}ms`)
  return result
}
