const { v4: uuidv4 } = require('uuid');
const express = require('express');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs')
      saltRounds = 10;
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      folder_db = require('../utils/db/folder')
      videoHelper = require('../utils/video/videoHelper')
      clipHelper = require('../utils/clip/clipHelper')
      time_helper = require('../utils/time/timeHelper')
      tag_db = require('../utils/db/tag')
      sdb = require('../utils/db/share')
      rule_db = require('../utils/db/rule')
      stripe = require('../utils/stripe/index')
      tagHelper = require('../utils/tag')
      require('express-async-errors');
      const { user, is_in_team } = require('../middleware/authMiddleware');

router.post('/', user, is_in_team(), async (req, res) => {
  const {
    resource_type,
    valid_days,
    resource_id
  } = req.body;
  const req_team_id = req.body.team_id;

  const code = uuidv4();
  
  let data = {}
  switch(resource_type) {
    case 'video':
      // check that team owns video
      const [{ team_id }] = await video_db.videoById(resource_id);
      if(req_team_id != team_id) throw new Error('wrong team id')
      data['video_id'] = resource_id
      break;
    case 'map':
    case 'time':
      const time = await time_helper.timeById(resource_id)
      if(req_team_id != time.team_id) throw new Error('wrong team id')
      data['time_id'] = resource_id
      break;
    case 'clip':
      // check that team owns clip
      const clip = await clipHelper.clipById(resource_id)
      if(req_team_id != clip.team_id) throw new Error('wrong team id')
      data['clip_id'] = resource_id
      break;
    case 'presentation':
    case 'filter':
    case 'text_file':
    case 'folder':
      const [ folder ] = await folder_db.byId(resource_id)
      if(req_team_id != folder.team_id) throw new Error('wrong team id')
      data['folder_id'] = folder.id
      break;
    default:
      throw new Error('invalid resource type')
  }

  await sdb.postShare({ // sdb = share_database
    code,
    resource_type,
    valid_days,
    ...data
  });

  res.json(process.env.FRONTEND_BASE_URL + '/#/share/' + code)
})

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  if(!code) throw new Error('no code')

  const [ share ] = await sdb.getShare(code)

  if(!share) throw new Error('Share link not valid')
  console.log(share.video_id)
  switch(share.resource_type) {
    case 'video':
      const video = await videoHelper.getVideo(share.video_id)
      res.send({...video, share})
      break;
    case 'clip':
      const clip = await clipHelper.clipById(share.clip_id)
      res.send({...clip, share})
      break;
    case 'folder':
      const [ folder ] = await folder_db.byId(share.folder_id)
      res.send({ ...folder, share })
      break;
    case 'time':
      const time = await time_helper.timeById(share.time_id)
      res.send({ ...time, share })
      break;
  }
})

module.exports = router;