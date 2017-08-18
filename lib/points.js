'use strict';

async function getPointsAmount(db, channel, userstate) {

  let user = userstate['user-id'];
  let amount = await db.users.find({ channel: channel, twitch_id: user});
  return amount[0].points;

}

async function getPointsName(db, channel) {

  let name = await db.channel_settings.find({ channel: channel });
  return name[0].points_name;

}

module.exports = {
  getPointsAmount: getPointsAmount,
  getPointsName: getPointsName
}
