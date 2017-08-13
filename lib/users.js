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

function getUserList(db) {
  var options = {
    uri: 'https://tmi.twitch.tv/group/user/talutha/chatters',
    json: true
  };

  RP(options).then( userList => {
    console.log(userList);
    processUserList(db, userList);
  }).catch( err => {
    console.log('Fetching user list did not work for some reason. ' + err)
  })
}

function processUserList(db, userList) {
  // twitch API only allows getting user objects in sets of 100
  var moderators = userList.chatters.moderators;
  var admins = userList.chatters.admins;
  var global_mods = userList.chatters.global_mods;
  var viewers = userList.chatters.viewers;

  while (moderators.length > 0) {
    let subsetList = moderators.splice(0, 99);
    addUsersToDB(db, subsetList);
  }

  while (admins.length > 0) {
    let subsetList = admins.splice(0, 99);
    addUsersToDB(db, subsetList);
  }

  while (global_mods.length > 0) {
    let subsetList = global_mods.splice(0, 99);
    addUsersToDB(db, subsetList);
  }

  while (viewers.length > 0) {
    let subsetList = viewers.splice(0, 99);
    addUsersToDB(db, subsetList);
  }
}

function addUsersToDB(db, userList) {
  var options = {
    uri: 'https://api.twitch.tv/kraken/users?login=' + userList.join(','),
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
        channel: '#talutha'
      }).then( user => {
        if (user.length === 0) throw "User Does Not Exist";
        db.users.update({
          twitch_id: userReturn.users[i]._id,
          channel: '#talutha'
        }, {
          twitch_id: userReturn.users[i]._id,
          display_name: userReturn.users[i].display_name,
          last_seen: new Date().toISOString(),
          // THIS CONCATENATES INSTEAD OF ADDS!!!!!!!
          points: user[0].points + 2
        }).catch( err => {
          console.log("Could not update existing user " + userReturn.users[i].display_name + err);
        })
      }).catch( err => {
        db.users.insert({
          twitch_id: userReturn.users[i]._id,
          display_name: userReturn.users[i].display_name,
          points: 500,
          channel: "#talutha",
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString()
        }).catch( err => {
          console.log("Could not add new user " + userReturn.users[i].display_name + err);
        })
      })
    }
  }).catch( err => {
    console.log('Getting user objects did NOT work! ' + err );
  })
}

module.exports = {
  getUserList: getUserList
};
