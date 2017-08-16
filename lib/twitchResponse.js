'use strict';

const request = require('request');
const config = require('../config');

const TWITCH_API = 'application/vnd.twitchtv.v5+json';

// object to store all usefull info related to channel
var channelInfo = {};
channelInfo.streamIsLive = false;
channelInfo.streamGame;
channelInfo.streamTitle;
channelInfo.streamStartDate;
channelInfo.userAvatar;

var refreshTimer;

/*
this is used to get the channel object
provided the channel name, all we really use
from here is the id value which is used in
other responses
*/
function getChannel(channelName) {
  return new Promise((resolve, reject) => {
    var options = {
      url: 'https://api.twitch.tv/kraken/channels/' + channelName,
      headers: {
        "Client-ID": TWITCH_API
      }
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        var info = JSON.parse(body);
        return resolve(info);
      } else {
        return reject(error);
      }
    });
  });
};

/*
returns stream object given the channel id,
used for determining if the stream is live or not
*/
function getStream(channelId) {
  return new Promise((resolve, reject) => {
    var options = {
      url: 'https://api.twitch.tv/kraken/streams/' + channelId,
      headers: {
        "Client-ID": config["Twitch Client ID"],
        "Accept": TWITCH_API
      }
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        var info = JSON.parse(body);
        return resolve(info.stream);
      } else {
        return reject(error);
      }
    });
  });
};

/*
returns user object given user id (same as channel id)
*/
function getUser(userId) {
  return new Promise((resolve, reject) => {
    var options = {
      url: 'https://api.twitch.tv/kraken/users/' + userId,
      headers: {
        "Client-ID": config["Twitch Client ID"],
        "Accept": TWITCH_API
      }
    };
    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        var info = JSON.parse(body);
        return resolve(info);
      } else {
        return reject(error);
      }
    });
  });
};

/*
returns list of top clips in the past 24h given a channel name
*/
function getClips(channelName) {
  return new Promise((resolve, reject) => {
    var options = {
      url: 'https://api.twitch.tv/kraken/clips/top?limit=10&period=day&channel='
      + channelName,
      headers: {
        "Client-ID": config["Twitch Client ID"],
        "Accept": TWITCH_API
      }
    };
    request(options, (error, response, body) => {
      if (!error) {
        var info = JSON.parse(body);
        return resolve(info.clips);
      } else {
        return reject(error);
      }
    });
  });
};

/*
refreshes various information related to a channel
such as stream status, stream title, and current game
*/
function getInfo() {
  let channelName = config["Twitch Channel"];
  getChannel(channelName)
  .then(res => {
    return getStream(res._id);
  })

  // stream related information
  .then(res => {
    if (res === null) {
      streamIsLive = false;
    } else {
      channelInfo.streamIsLive = true;
      channelInfo.streamGame = res.game;
      channelInfo.streamTitle = res.channel.status;
      channelInfo.streamStartDate = res.created_at;
    }
  })
  .catch(err => {
    console.log(err);
  });

  getChannel(channelName)
  .then(res => {
    return getUser(res._id);
  })

  // user related information
  .then(res => {
    channelInfo.userAvatar = res.logo;
  })
  .catch(err => {
    console.log(err);
  });
}

function refreshInfoStart() {
  refreshTimer = setInterval(getInfo, 5000);
}

function refreshInfoStop() {
  clearInterval(refreshTimer);
}

module.exports = {
  startInterval: refreshInfoStart,
  stopInterval: refreshInfoStop,
  channelInfo: channelInfo
}
