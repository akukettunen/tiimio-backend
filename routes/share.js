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
      videoHelper = require('../utils/video/videoHelper')
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
  console.log(req.body)
  switch(resource_type) {
    case 'video':
      // check that team owns video
      const [{ team_id }] = await video_db.videoById(resource_id);
      if(req_team_id != team_id) throw new Error('wrong team id')
      await sdb.postShare({ // sdb = share_database
        code,
        resource_type,
        valid_days,
        video_id: resource_id
      });
      break;
    case 'map':
    case 'time':
    case 'clip':
    case 'presentation':
    case 'filter':
    case 'folder':
    default:
      throw new Error('invalid resource type')
  }

  res.json(process.env.FRONTEND_BASE_URL + '/#/share/' + code)
})

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  if(!code) throw new Error('no code')

  const [share] = await sdb.getShare(code)

  switch(share.resource_type) {
    case 'video':
      const video = await videoHelper.getVideo(share.video_id)
      res.send(video)
      break;
  }


})

module.exports = router;