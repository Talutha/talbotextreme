'use strict';

const config = require('../config.json');
const RESET_TIME = 15;
const TWITCH_INFO = require('./twitchResponse.js');

var discordObj;
var discordClient;
var cooldown;
var notified;
var startDate;

// starts the interval to post a discord message
function startNotifier(argObj, argClient) {
  discordObj = argObj;
  discordClient = argClient;
  TWITCH_INFO.startInterval();
  setInterval(messageCheck, 5000);
}


// posts a message to discord, nothing exciting
function postMessage() {
  let info = TWITCH_INFO.channelInfo;
  let channel = discordClient.guilds.get(config["Discord Guild ID"]).defaultChannel;
  let embed = new discordObj.RichEmbed();
  let message = '@here Hey, ' + config["Twitch Channel"] +
  ' just went live! http://www.twitch.tv/' + config["Twitch Channel"];

  embed.setColor(3447003);
  embed.setAuthor(config["Twitch Channel"] + ' has started streaming!');
  embed.setTitle('Watch now on twitch.tv');
  embed.setURL('http://www.twitch.tv/' + config["Twitch Channel"]);
  embed.addField('Now Playing:', info.streamGame);
  embed.addField('Stream Title:', info.streamTitle);
  embed.setTimestamp(startDate);
  embed.setThumbnail(info.userAvatar);

  channel.send(message, {embed});
}

// logic function for determining wheather or not to post notification
function messageCheck() {
  let isOnline = TWITCH_INFO.channelInfo.streamIsLive;

  // stream is online but has not be notified, post notication
  if (isOnline && !notified) {
    startDate = new Date();
    postMessage();
    notified = true;
    console.log('The stream is currently online, notification posted!');

  /*
  stream is online and a notification has already been posted
  dont do anything else for now
  */
  } else if (isOnline && notified) {
    console.log('The stream is currently online!');

  /*
  if stream is offline and no cooldown is started
  start a check at specified time later to see if
  the stream is off line
  */
  } else if (!isOnline && !cooldown) {
      setTimeout(function () {
      console.log('Cooldown finished!');
      cooldown = false;
      // stream is offline for good
      if (!isOnline && notified) {
        notified = false;
      }
    }, (60000 * RESET_TIME));
    cooldown = true;
    console.log('The stream is currently offline, cooldown started!');

  // any other state we shall just assume the stream is offline
  } else {
    console.log('The stream is currently offline, cooldown is running!');
  }
}

module.exports = {
  startNotifier: startNotifier
}
