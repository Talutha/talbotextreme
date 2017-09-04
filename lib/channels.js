'use strict';

const CONFIG = require('../config.json');
const USERS = require('./users.js');
const TIMERS = require('./timers.js');
const RP = require('request-promise-native');
const CLIENTID = CONFIG['Twitch Client ID'];


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
  else if (message[1] === 'points_online_interval') {

    // Input: [settings, points_online_interval, 1200]
    changeOnlineInterval();

  }
  else if (message[1] === 'points_per_iteration') {

    // Input: [settings, points_per_iteration, 10]
    changePointsPerIteration();

  } else if (message[1] === 'points_activated') {

    // Input: [settings, points_activated, false]
    changePointsActivated();

  } else if (message[1] === 'points_name') {

    // Input: [settings, points_name, missing, pants]
    changePointsName();

  } else if (message[1] === 'points_command') {

    // Input: [settings, points_command, missingpants]
    changePointsCommand();

  }

}

// long function, wonder if I can refactor somehow
async function channelsOnline() {
  try {

    // console.log('Running Online Check');
    let db = global.db;
    let joinedChannels = await db.channel_settings.find({ joined: true });
    let channelList = [];
    let channelReturn;
    let currentTimers = TIMERS.showTimers();
    let onlineChannels = [];
    

    for (let channel in joinedChannels) {
      channelList.push(joinedChannels[channel].broadcaster);
    }
    
    channelReturn = await channelCheck(channelList);
    channelReturn = channelReturn['streams'];

    for (let channel in channelReturn) {
      let pushThis = channelReturn[channel]['channel']['name'];
      pushThis = '#' + pushThis;
      onlineChannels.push(pushThis);
    }
   
    for (let channel in currentTimers) {
      if (currentTimers.hasOwnProperty(channel)) {
        let lastShownOnline = currentTimers[channel].online;
        let currentlyOnline = onlineChannels.includes(channel);

        // If channel is now online
        if (!lastShownOnline && currentlyOnline) {
          console.log(`${channel} is now online.`);
          TIMERS.changeOnlineStatus(channel);
        } 
        // If channel has gone offline
        else if (lastShownOnline && !currentlyOnline) {
          console.log(`${channel} is now offline.`);
          TIMERS.changeOnlineStatus(channel);
        }
      }
    }
  } catch (err) {
    console.log('channelsOnline Error:');
    if (err.statusCode === 500) {
      console.log('Twitch Returned a 500 service error.');
    } else {
      console.log(err);
    }
  }
}

async function joinChannels(database, cl) {
  try {
    db = database;
    client = cl;
    let joinedChannels = await db.channel_settings.find({ joined: true });

    for (let channel in joinedChannels) {
      channel = joinedChannels[channel];

      client.join(channel.channel);
      USERS.processOnlineUsers(db, channel.channel);
      TIMERS.addChannel(channel.channel);
      TIMERS.startPointsTimer(db, channel.channel);

    }

    TIMERS.checkOnlineStatus(channelsOnline);
    TIMERS.hourlyTimer();

  } catch (err) {
    console.log('joinChannels Error:');
    console.log(err);
  }

}

async function joinChannel() {
  try {

    let workingChannel = '#' + userstate['username'];
    let findChannel = await db.channel_settings.find({ 
      channel: workingChannel 
    });

    if (client.getChannels().includes(workingChannel)) {
      client.say(channel, `I am already in ${workingChannel}.`);
      return;
    }

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

      console.log('Successfully added ' + workingChannel + ' to the database.');

    } else {

      await db.channel_settings.update(
        { channel: workingChannel },
        { joined: true }
      );

      
    }

    client.join(workingChannel);
    client.say(channel, `I have joined ${workingChannel}!`);
    TIMERS.addChannel(workingChannel);
    TIMERS.startPointsTimer(db, workingChannel);

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

      client.say(channel, `I am leaving ${workingChannel} :(...`);
      client.part(workingChannel);
      TIMERS.stopPointsTimer(workingChannel);

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

    if (offlineInterval >= 10) {

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

async function changeOnlineInterval() {
  try {

    // Input: [settings, points_offline_interval, 100]
    let onlineInterval = message[2];

    if (onlineInterval >= 10) {

      // update db with new points setting
      await db.channel_settings.update(
        { channel: channel },
        { points_online_interval: onlineInterval }
      );

      // stop current timer
      TIMERS.stopPointsTimer(channel);

      // start new timer
      TIMERS.startPointsTimer(db, channel);

      client.say(channel, 
        `Points will be distributed every ${onlineInterval} seconds while ` 
        + `${channel} is live.`
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

async function changePointsActivated() {
  try {

    // Input: [settings, points_activated, false]
    // Convert activated string to boolean
    let bool = (message[2].toLowerCase() == 'true');


    if (typeof(bool) == 'boolean') {

      await db.channel_settings.update(
        { channel: channel },
        { points_activated: bool }
      );

      client.say(channel, 
        'Points are ' + (bool ? 'activated' : 'deactivated') + '.');

      // restart current timer and check if points are activated
      TIMERS.stopPointsTimer(channel);
      TIMERS.startPointsTimer(db, channel);

    }

  } catch (err) {
    console.log('changePointsActivated Error: ');
    console.log(err);
  }

}

async function changePointsName() {
  try {

    // Input: [settings, points_name, missing, pants]

    // Make sure user provided enough to update the setting
    if (message.length < 3) {
      return;
    }

    let newName = message.splice(2).join(' ');
    let oldName = await db.channel_settings.find({ channel: channel });
    oldName = oldName[0].points_name;

    await db.channel_settings.update(
      { channel: channel },
      { points_name: newName }
    );

    client.say(channel,
      `${oldName} has been changed to ${newName}.`
    );

  } catch (err) {
    console.log('changePointsName Error: ');
    console.log(err);
  }
}

async function changePointsCommand() {
  try {

    // Input: [settings, points_command, missingpants]
    if (message.length !== 3) {
      client.say(channel, 'Points command must be only one word.');
      return;
    }

    let newCommand = message[2];
    let oldCommand = await db.channel_settings.find({ channel: channel });
    oldCommand = oldCommand[0].points_command;

    await db.channel_settings.update(
      { channel: channel },
      { points_command: newCommand }
    );

    client.say(channel,
      `'!${oldCommand}' has been changed to '!${newCommand}'.`    
    );

  } catch (err) {
    console.log('changePointsCommand Error: ');
    console.log(err);
  }
}

// This function should only take an array or comma separated string
// THESE SHOULD BE BROADCASTER IDs, NOT USERNAMES!
async function channelCheck(channelList) {

  // Convert to string if array
  if (Array.isArray(channelList)) {
    channelList = channelList.join(',');
  }
  
  let options = {
    uri: 'https://api.twitch.tv/kraken/streams/?channel=' + channelList,
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'Accept: application/vnd.twitchtv.v5+json',
      'Client-ID': CLIENTID
    }
  };

  let channelReturn = await RP(options);
 
  return channelReturn;

}

module.exports = {
  processChannels: processChannels,
  joinChannels: joinChannels
};
