'use strict';

const RP = require('request-promise-native');
const CONFIG = require('../config.json');
const POINTS = require('./points.js');
const UTIL = require('util');
const DB = require('./database.js');

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

async function processForPoints(db, userList, channel, points) {
  try {
    // 24 hours in milliseconds
    let updateThreshold = 24 * 60 * 60 * 1000;
    let askTwitch = [];

    for (let user of userList) {
      let dbReturn = await db.users.find({ lname: user, channel: channel });
      // If user is not found, returns []
      /*
        Possible scenarios:
          1) User is in DB and has been updated in the past 24 hours
          2) User is in DB and has NOT been updated in the past 24 hours
          3) User is NOT in DB
          4) User is NOT in DB but has the same ID as another user per Twitch API
      */
      
      if (dbReturn.length === 0) {
        // query Twitch API and add to DB
        askTwitch.push(user);
      } else { 
        let currentTime = new Date();
        let lastUpdated = new Date(dbReturn[0]['updated']);
        lastUpdated = currentTime - lastUpdated;

        if (lastUpdated > updateThreshold) {
          askTwitch.push(user);
        } else {
          await POINTS.modifyPoints(db, channel, dbReturn[0]['twitch_id'], points);
          await db.users.update({
            twitch_id: dbReturn[0]['twitch_id'],
            channel: channel
          }, {
            last_seen: new Date().toISOString()
          });
        }

      }
    }

    while (askTwitch.length > 0) {
      let subsetList = askTwitch.splice(0, 99);
      subsetList = subsetList.join(',');
      await addUsersToDB(db, subsetList, channel);
      await giveUsersPoints(db, subsetList, channel, points);
    }

  } catch (err) {
    console.log('processForPoints Error:');
    console.log(err);
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
          lname: userList[i].name,
          points: 500,
          channel: channel,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          updated: new Date().toISOString(),
        });

      } else {

        await db.users.update({
          twitch_id: userList[i]._id,
          channel: channel
        }, {
          display_name: userList[i].display_name,
          lname: userList[i].name,
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
      lname: userstate['name'],
      points: 500,
      channel: channel,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      updated: new Date().toISOString()
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

// TODO: Still making a pointless API call here, remove!
async function giveUsersPoints(db, userList, channel, points) {

  // userList is a string of names, e.g. userList = 'Talutha,slm_shockz';
  userList = userList.split(',');
  try {

    for (let user in userList) {
      let userDB = await db.users.find({ lname: userList[user], channel: channel });
      let userID  = userDB[0].twitch_id;
      POINTS.modifyPoints(global.db, channel, userID, points);
      global.db.users.update({
        twitch_id: userID,
        channel: channel
      }, {
        last_seen: new Date().toISOString(),
        updated: new Date().toISOString()
      });
    }

  } catch (err) {
    console.log('giveUserPoints Error:');
    console.log(err);
  }

}

// takes a userID and returns the user's Twitch display name.
async function toDisplayName(userID) {

  let db = await DB.db;
  let displayName = await db.users.find({ twitch_id: userID });
  displayName = displayName[0].display_name;

  return displayName;

}

// injects various functions into userstate provided by tmi.js
async function injectPayload(userstate, channel) {

  let userID = userstate['user-id'];

  // easier access to points amount through userstate rather than writing
  // a function each time
  userstate.getPointsAmount = async function() {
    let points = await Points.getAmount(channel, userID);
    return points;
  };

  return userstate;

}

let Points = {

  getAmount: async function(channel, userID) {

    let db = await DB.db;
    let amount = await db.users.find({ channel: channel, twitch_id: userID });
    return amount[0].points;

  },

  modify: async function(channel, userID, amount) {
    try {

      let db = await DB.db;
      let currentAmount = await amount(db, channel, userID);
      let newAmount = parseInt(currentAmount) + parseInt(amount);

      // Do not allow points to go negative
      if (newAmount < 0) {
        newAmount = 0;
      }

      //Update database with new point amount
      await db.users.update({
        twitch_id: userID,
        channel: channel
      }, {
        points: newAmount
      });
    } catch (err) {
      console.log('modifyPoints error:');
      console.log(err);
    }
  }

};

module.exports = {
  getUserList: getUserList,
  getUserInfo: getUserInfo,
  addUserToDB: addUserToDB,
  processOnlineUsers: processOnlineUsers,
  processForPoints: processForPoints,
  toDisplayName: toDisplayName,
  Points: Points,
  injectPayload: injectPayload
};

