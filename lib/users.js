const RP = require('request-promise-native');

function getUserList() {
  var options = {
    uri: 'https://tmi.twitch.tv/group/user/talutha/chatters',
    json: true
  };

  RP(options).then( userList => {
    console.log(userList);
  }).catch( err => {
    console.log('Fetching user list did not work for some reason. ' + err)
  })
}

module.exports = {
  getUserList: getUserList
};
