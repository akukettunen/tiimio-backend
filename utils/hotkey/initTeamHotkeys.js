const { init_hotkeys } = require('../team/initialValues');
const hotkey_db = require('../db/hotkey');

const initTeamHotkeys = async team_id => {
  // THIS IS AN UNSAFE FUNCTION
  // meaning that the team_id is not validated
  // therefore the team_id should come from system - not user (aka the jwt)

  const hotkeys = init_hotkeys()

  const hotkeyPromises = hotkeys.map(hotkey => {
    return hotkey_db.addHotkey({
      team_id,
      hotkey: hotkey.hotkey,
      shift: hotkey.shift,
      hotkey_action: hotkey.hotkey_action
    })
  })

  try {
    await Promise.all(hotkeyPromises)
  } catch(e) {
    throw new Error(e)
  }
}

module.exports = { initTeamHotkeys }