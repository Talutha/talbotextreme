'use strict';

const RP = require('request-promise-native');
const CONFIG = require('../config.json');
const POINTS = require('./points.js');

var client_id = CONFIG['Twitch Client ID'];

/*
Users table:
id -> int, serial, primary key
twitch_id -> bignum
display_name -> varchar
points -> bigint
channel -> varchar
first_seen -> timestamp
last_seen -> timestamp
*/

async function getUserInfo(username) {

  // Recieves a username and returns user object containing Twitch info
  var options = {
    uri: 'https://api.twitch.tv/kraken/users?login=' + username,
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'Accept: application/vnd.twitchtv.v5+json',
      'Client-ID': client_id
    }
  };

  /*
  Should return a JSON blob like this:

  {
   "_total": 1,
   "users": [
      {
         "_id": "129454141",
         "bio": null,
         "created_at": "2016-07-13T14:40:42.398257Z",
         "display_name": "dallasnchains",
         "logo": null,
         "name": "dallasnchains",
         "type": "user",
         "updated_at": "2017-02-04T14:32:38.626459Z"
      }
   ]
}
  */

  let userObject = await RP(options);
  return userObject;

}

async function processOnlineUsers(db, channel) {
  let userList = await getUserList(db, channel);
  processUserList(db, userList, channel);
}

async function getUserList(db, channel) {
  // remove # from channel name for url
  let ch = channel.slice(1);
  let url = 'https://tmi.twitch.tv/group/user/' + ch + '/chatters';
  let options = {
    uri: url,
    json: true
  };

  let userList = await RP(options);
  let chatterArray = [];

  for (let property in userList.chatters) {
    if (userList.chatters.hasOwnProperty) {
      chatterArray = chatterArray.concat(userList.chatters[property]);
    }
  }

  return chatterArray;
}

// TODO: refactor following two functions as they are pretty much the same thing
function processForPoints(db, userList, channel, points) {

  while (userList.length > 0) {
    let subsetList = userList.splice(0, 99);
    subsetList = subsetList.join(',');
    giveUsersPoints(db, subsetList, channel, points);
  }

}

function processUserList(db, userList, channel) {

  // twitch API only allows getting user objects in sets of 100
  while (userList.length > 0) {
    let subsetList = userList.splice(0, 99);
    subsetList = subsetList.join(',');
    addUsersToDB(db, subsetList, channel);
  }

}

async function addUsersToDB(db, users, channel) {

  var options = {
    uri: 'https://api.twitch.tv/kraken/users?login=' + users,
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'Accept: application/vnd.twitchtv.v5+json',
      'Client-ID': client_id
    }
  };

  try {

    let userReturn = await RP(options);
    let userList = userReturn.users;

    for (let i = 0; i < userList.length; i++) {
      let user = await db.users.find({
        twitch_id: userList[i]._id,
        channel: channel
      });

      // user does not exist
      if (user.length === 0) {

        await db.users.insert({
          twitch_id: userList[i]._id,
          display_name: userList[i].display_name,
          points: 500,
          channel: channel,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          updated: new Date().toISOString()
        });

      } else {

        await db.users.update({
          twitch_id: userList[i]._id,
          channel: channel
        }, {
          display_name: userList[i].display_name,
          last_seen: new Date().toISOString()
        });

      }
    }

  } catch (err) {
    console.log('addUsersToDB Error:');
    console.log(err);
  }
}

async function addUserToDB(db, channel, userstate) {

  // Check database to see if user exists
  let userInfo = await db.users.find({
    twitch_id: userstate['user-id'],
    channel: channel
  });

  if (userInfo.length === 0) {
    // User was not found in DB
    await db.users.insert({
      twitch_id: userstate['user-id'],
      display_name: userstate['display-name'],
      points: 500,
      channel: channel,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString()
    });
  } else {
    // User was found
    await db.users.update({
      twitch_id: userstate['user-id'],
      channel: channel
    }, {
      display_name: userstate['display-name'],
      last_seen: new Date().toISOString()
    });
  }

}

async function giveUsersPoints(db, userList, channel, points) {
  var options = {
    uri: 'https://api.twitch.tv/kraken/users?login=' + userList,
    method: 'GET',
    json: true,
    headers: {
      'Accept': 'Accept: application/vnd.twitchtv.v5+json',
      'Client-ID': client_id
    }
  };

  try {
    let userReturn = await RP(options);
    for (let i = 0; i < userReturn.users.length; i++) {
      let userID  = userReturn.users[i]._id;
      POINTS.modifyPoints(global.db, channel, userID, points);
      global.db.users.update({
        twitch_id: userID,
        channel: channel
      }, {
        last_seen: new Date().toISOString()
      });
    }
  } catch (err) {
    console.log(err);
  }

}

module.exports = {
  getUserList: getUserList,
  getUserInfo: getUserInfo,
  addUserToDB: addUserToDB,
  processOnlineUsers: processOnlineUsers,
  processForPoints: processForPoints
};

