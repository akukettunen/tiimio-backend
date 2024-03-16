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
  // "jpg:120x": {
  //   "key": "jpg:tooltip",
  //   "path": `${file}/tooltip/image.jpg`,
  //   "interval": 3,
  //   "sprite": true,
  //   "vtt": true
  // },
  // 'mp4:720p': {
  //   'path': `${file}/720p.mp4`
  // },
  'mp4:1280x720::quality=4': {
    'path': `${file}/720p.mp4`
  }
  // 'httpstream': {
  //   'hls': { 'path': 'hls/' }
  // }
  }
}

const high_definition = (file) => {
  return {
   'jpg:480x270': {
     'path': `${file}/thumbnail_medium.jpg`, 
     "key": "jpg:medium" 
   },
   'jpg:60x34': {
     'path': `${file}/thumbnail_low.jpg`,
     "key": "jpg:low"
   },
  //  "jpg:120x": {
  //   "key": "jpg:tooltip",
  //   "path": `${file}/tooltip/image.jpg`,
  //   "interval": 3,
  //   "sprite": true,
  //   "vtt": true
  // },
   // 'mp4:720p': {
   //   'path': `${file}/720p.mp4`
   // },
   'mp4:1920x1080::quality=4': {
    'path': `${file}/1080p.mp4`,
    'video_codec': 'h264',
    'audio_codec': 'mp3'
  }
   // 'httpstream': {
   //   'hls': { 'path': 'hls/' }
   // }
   }
 }


module.exports = { normal, high_definition }