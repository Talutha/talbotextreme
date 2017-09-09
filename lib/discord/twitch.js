'use strict';


const rp = require('request-promise-native');
const config = require('../../config.json');

const TWITCH_API = 'application/vnd.twitchtv.v5+json';


/**
* creates an object to be used with a request, example:
* * choice: channel  value: channel name
* * choice: stream   value: stream id
*/
function getOptions(choice, value){
  let options = {
    headers: {
      'Client-ID': config['Twitch Client ID'],
    }
  };

  switch (choice) {

  case 'channel':
    options.url = 'https://api.twitch.tv/kraken/channels/' + value;
    break;

  case 'stream':
    options.url = 'https://api.twitch.tv/kraken/streams/' + value;
    options.headers.Accept = TWITCH_API;
    break;

  default:
    console.log(choice + ' is not an accepted option.' +
    ' Accepted values: user, channel, or stream');
    break;
  }

  return options;
}


// returns a promise to get the channel response
async function fetchChannelResponse(name) {
  let options = getOptions('channel', name);
  
  try {
    let response = await rp(options);
    return JSON.parse(response);

  } catch (error) {
    console.log('Error in fetchChannelResponse()', JSON.parse(error.error));
    return null;
  }

}


// returns a promise to get the stream response
async function fetchStreamResponse(id) {
  let options = getOptions('stream', id);
  
  try {
    let response = await rp(options);
    return JSON.parse(response);

  } catch (error) {
    console.log('Error in fetchStreamResponse()', JSON.parse(error.error));
    return null;
  }

}


// returns a promise to get a stream object
async function getStream(name) {
  
  let response;

  try {
    response = await fetchChannelResponse(name);
    response = await fetchStreamResponse(response._id);
    return response.stream;

  } catch (error) {
    console.log('Error in getStream()', error);
    return null;
  }

}


// takes a stream response and turns it into an object
function createStreamerObject(streamInfo) {
  
  let streamerObject = {
    name: streamInfo.channel.display_name,
    title: streamInfo.channel.status,
    game: streamInfo.channel.game,
    avatar: streamInfo.channel.logo,
    url: streamInfo.channel.url,
    isLive: true,
    startTime: new Date()
  };

  return streamerObject;
}


// returns a promise to create a streamer object from a streamer response if
// the resonse is not null
async function getStreamerObject(channelName) {

  let offlineStream = {
    name: channelName,
    isLive: false
  };

  try {
    let streamResponse = await getStream(channelName);

    if (streamResponse != null) {
      return createStreamerObject(streamResponse);
    } else {
      return offlineStream;
    }

  } catch (error) {
    console.log('Error in getStreamObject()', error);
    return offlineStream;
  }

}


// returns an array of promises to create streamer objects from an 
// array of streamer names
function getStreamersFromArray(streamerNamesArray) {

  let promises = streamerNamesArray.map(streamerName => {
    return getStreamerObject(streamerName);
  });

  return Promise.all(promises)
    .catch(error => {
      console.log('Error in getStreamersFromArray()', error);
    });

}

module.exports = {
  getStreamersFromArray
};