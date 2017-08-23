'use strict';

const USERS = require('./users.js');
const TIMERS = require('./timers.js');


let db, client, channel, userstate, message;

function processChannels(database, cl, ch, us, msg) {

  db = database;
  client = cl;
  channel = ch;
  userstate = us;
  message = msg;

  if (message[0] === 'join') {

    // Input: [join]
    joinChannel();

  }
  else if (message[0] === 'leave') {

    // Input: [leave]
    leaveChannel();

  }
  else if (message[1] === 'points_offline_interval') {

    // Input: [settings, points_offline_interval, 1200]
    changeOfflineInterval();

  }
  else if (message[1] === 'points_per_iteration') {

    // Input: [settings, points_per_iteration, 10]
    changePointsPerIteration();

  }

}

function joinChannels(database, cl) {
  db = database;
  client = cl;
  db.channel_settings.find({
    joined: true
  }).then(results => {
    for (let i = 0; i < results.length; i++) {
      client.join(results[i].channel);
      USERS.processOnlineUsers(db, results[i].channel);
      TIMERS.addChannel(results[i].channel);
      TIMERS.startPointsTimer(db, results[i].channel);
    }
  }).catch(err => {
    console.log(err);
  });
}

async function joinChannel() {
  try {

    let workingChannel = '#' + userstate['username'];
    let findChannel = await db.channel_settings.find({ 
      channel: workingChannel 
    });

    // if channel does not exist in db, add it then join, otherwise just join
    if (findChannel.length === 0) {

      await db.channel_settings.insert({
        channel: workingChannel,
        broadcaster: userstate['user-id'],
        points_command: 'points',
        points_name: 'points',
        points_activated: true,
        points_offline_interval: 1200,
        points_online_interval: 120,
        points_per_iteration: 10,
        joined: true
      });

      client.join(workingChannel);
      console.log('Successfully added ' + workingChannel + ' to the database.');

    } else {

      await db.channel_settings.update(
        { channel: workingChannel },
        { joined: true }
      );

      client.join(workingChannel);

    }

  } catch (err) {
    console.log('joinChannel error:');
    console.log(err);
  }
}

async function leaveChannel() {
  try {

    let workingChannel = '#' + userstate['username'];

    // make sure we are currently connected to the channel
    if (client.getChannels().includes(workingChannel)) {

      await db.channel_settings.update(
        { channel: workingChannel},
        { joined: false }
      );

      client.part(workingChannel);

    }

  } catch (err) {
    console.log('leaveChannel error:');
    console.log(err);
  }
}

async function changeOfflineInterval() {
  try {

    // Input: [settings, points_offline_interval, 100]
    let offlineInterval = message[2];

    if (offlineInterval >= 60) {

      // update db with new points setting
      await db.channel_settings.update(
        { channel: channel },
        { points_offline_interval: offlineInterval }
      );

      // stop current timer
      TIMERS.stopPointsTimer(channel);

      // start new timer
      TIMERS.startPointsTimer(db, channel);

      client.say(channel, 
        `Points will be distributed every ${offlineInterval} seconds while ` 
        + `${channel} is offline.`
      );

    } else {
      client.say(channel,
        'Points interval must be at least 60 seconds.');
    }

  } catch (err) {
    console.log(err);
  }


}

async function changePointsPerIteration() {
  try {

    let ppi = message[2];
    // Input: [settings, points_per_iteration, 10]
    if (ppi > 0) {

      await db.channel_settings.update(
        { channel: channel },
        { points_per_iteration: ppi }
      );

      client.say(channel,
        `${ppi} points will be distributed at set intervals.`);
    }

  } catch (err) {
    console.log(`changePointsPerIteration Error: \n ${err}`);
  }

}

module.exports = {
  processChannels: processChannels,
  joinChannels: joinChannels
};
