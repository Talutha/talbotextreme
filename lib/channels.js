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
  })
}

function joinChannel() {
  let workingChannel = "#" + userstate['username'];
  db.channel_settings.find({
    channel: workingChannel
  }).then(result => {
    if (result.length === 0) throw "Channel Not In Database";
    // Set joined to true
    client.join(workingChannel);
    db.channel_settings.update({
      channel: workingChannel
    }, {
      joined: true
    })
  }).catch(err => {
    db.channel_settings.insert({
      channel: workingChannel,
      broadcaster: userstate['user-id'],
      points_command: 'points',
      points_name: 'points',
      points_activated: false,
      points_offline_interval: 1200,
      points_online_interval: 120,
      points_per_iteration: 10,
      joined: true
    }).then(success => {
      client.join(workingChannel);
      console.log("Successfully added " + workingChannel + " to the database.");
    }).catch(failure => {
      console.log("I was not able to add " + workingChannel
                  + " to the database.");
      console.log(failure);
      client.say(channel, "I apologize " + userstate['display-name']
                 + " but I could not join your channel.");
    })
  })
}

function leaveChannel() {
  let workingChannel = "#" + userstate['username'];
  if (client.getChannels().includes(workingChannel)) {
    db.channel_settings.update({
      channel: workingChannel
    }, {
      joined: false
    }).then( result => {
      client.part(workingChannel);
    }).catch(err => {
      console.log("Error during channel part: ")
      console.log(err);
    })
  }
}

module.exports = {
  processChannels: processChannels,
  joinChannels: joinChannels
}
