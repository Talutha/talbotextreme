'use strict';

const USERS = require('./users.js');
const TIMERS = require('./timers.js');
const POINTS = require('./points.js');

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
      POINTS.startPointsTimer(db, results[i].channel);
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

function leaveChannel() {
  let workingChannel = '#' + userstate['username'];
  if (client.getChannels().includes(workingChannel)) {
    db.channel_settings.update({
      channel: workingChannel
    }, {
      joined: false
    }).then( result => {
      client.part(workingChannel);
    }).catch(err => {
      console.log('Error during channel part: ');
      console.log(err);
    });
  }
}

module.exports = {
  processChannels: processChannels,
  joinChannels: joinChannels
};
