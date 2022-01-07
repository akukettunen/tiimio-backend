const normal = (file) => {
 return {
  'jpg:480x270': {
    'path': `${file}/thumbnail_medium.jpg`, 
    "key": "jpg:medium" 
  },
  'jpg:60x34': {
    'path': `${file}/thumbnail_low.jpg`,
    "key": "jpg:low"
  },
  'mp4:720p': {
    'path': `${file}/720p.mp4`
  }
  // 'httpstream': {
  //   'hls': { 'path': 'hls/' }
  // }
}
}


module.exports = { normal }