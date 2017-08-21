const RP = require('request-promise-native');
const CONFIG = require('../config.json');

var client_id = CONFIG["Twitch Client ID"];

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
    method: "GET",
    json: true,
    headers: {
      "Accept": "Accept: application/vnd.twitchtv.v5+json",
      "Client-ID": client_id
    }
  }

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
  console.log('processing');
  processUserList(db, userList, channel);
}

async function getUserList(db, channel) {
  // remove # from channel name for url
  ch = channel.slice(1);
  let url = "https://tmi.twitch.tv/group/user/" + ch + "/chatters";
  let options = {
    uri: url,
    json: true
  };

  let userList = await RP(options);
  console.log(userList);
  return userList;
}

function processUserList(db, userList, channel) {
  // twitch API only allows getting user objects in sets of 100
  var moderators = userList.chatters.moderators;
  var admins = userList.chatters.admins;
  var global_mods = userList.chatters.global_mods;
  var viewers = userList.chatters.viewers;

  // TODO: Refactor this into a For loop or something
  while (moderators.length > 0) {
    let subsetList = moderators.splice(0, 99);
    subsetList = subsetList.join(',');
    addUsersToDB(db, subsetList, channel);
  }

  while (admins.length > 0) {
    let subsetList = admins.splice(0, 99);
    subsetList = subsetList.join(',');
    addUsersToDB(db, subsetList, channel);
  }

  while (global_mods.length > 0) {
    let subsetList = global_mods.splice(0, 99);
    subsetList = subsetList.join(',');
    addUsersToDB(db, subsetList, channel);
  }

  while (viewers.length > 0) {
    let subsetList = viewers.splice(0, 99);
    subsetList = subsetList.join(',');
    addUsersToDB(db, subsetList,channel);
  }
}

function addUsersToDB(db, users, channel) {
  var options = {
    uri: 'https://api.twitch.tv/kraken/users?login=' + users,
    method: "GET",
    json: true,
    headers: {
      "Accept": "Accept: application/vnd.twitchtv.v5+json",
      "Client-ID": client_id
    }
  }

  RP(options).then( userReturn => {
    for (let i = 0, l = userReturn.users.length; i < l; i++) {
      db.users.find({
        twitch_id: userReturn.users[i]._id,
        channel: channel
      }).then( user => {
        if (user.length === 0) throw "User Does Not Exist";
        db.users.update({
          twitch_id: userReturn.users[i]._id,
          channel: channel
        }, {
          display_name: userReturn.users[i].display_name,
          last_seen: new Date().toISOString(),
          // This adds 2 points every time a user is detected, DO NOT KEEP THIS
          // IN THE PROGRAM!
          points: Number(user[0].points) + 2
        }).catch( err => {
          console.log("Could not update existing user "
                      + userReturn.users[i].display_name + err);
        })
      }).catch( err => {
        db.users.insert({
          twitch_id: userReturn.users[i]._id,
          display_name: userReturn.users[i].display_name,
          points: 500,
          channel: channel,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString()
        }).catch( err => {
          console.log("Could not add new user "
                      + userReturn.users[i].display_name + err);
        })
      })
    }
  }).catch( err => {
    console.log("Getting user objects did NOT work! " + err );
  })
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
    })
  } else {
    // User was found
    await db.users.update({
      twitch_id: userstate['user-id'],
      channel: channel
    }, {
      display_name: userstate['display-name'],
      last_seen: new Date().toISOString()
    })
  }

}

module.exports = {
  getUserList: getUserList,
  getUserInfo: getUserInfo,
  addUserToDB: addUserToDB,
  processOnlineUsers: processOnlineUsers
};
