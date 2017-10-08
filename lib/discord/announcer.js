'use strict';

const config = require('../../config.json');
const DB = require('../database.js');
const TWITCH = require('./twitch.js');

const COOLDOWN = 60000 * config['Discord Announcer Cooldown'];

let db, discord, client;


async function start(argDiscord, argClient){

  db = await DB.getDB();
  discord = argDiscord;
  client = argClient;

  setInterval(async () => {
    await processAnnouncers();
  }, 5000);

}


// gets array of objects containing relevant info for each twitch channel
// stored in the database
async function getTwitchChannels() {

  try {
    
    let dbResponse, twitchNameArray;

    dbResponse = await db.announcerGetUniqueTwitchNames();
    twitchNameArray = dbResponse.map(element => {
      return element.twitch_channel_name;
    });
    
    return TWITCH.getStreamersFromArray(twitchNameArray);

  } catch (error) {
    
    console.log('Error in getUniqueTwitchNames()', error);
    return null;

  }

}


// returns a discord channel object that is found based
// on the passed guild_id and channel_id pair
function getDiscordChannel(idPair) {

  try {

    let guild = client.guilds.find('id', idPair.discord_guild_id);
    let channel = guild.channels.find('id', idPair.discord_channel_id);
    return channel;

  } catch (error) {

    console.log('Error in getDiscordChannelToAnnounce()', error);
    return null;

  }
  
}


// given a twitch name, returns an array of channel objects
// that will be used to post a message in their respective guilds
async function getDiscordChannels(twitchName) {

  try {
    
    let pairsArray = await db.announcerGetIdPairs(twitchName.toLowerCase());
    let discordChannels = pairsArray.map(pair => {
      return getDiscordChannel(pair);
    });
  
    return discordChannels;

  } catch (error) {

    console.log('Error in getDiscordChannels()', error);
    return null;

  }

}

// appends array of required discord channels to a twitch channel object
async function createAnnouncerObject(twitchChannel) {
  
  let object = twitchChannel;

  object.announceChannels = await getDiscordChannels(twitchChannel.name);

  return object;
  
}


// creates announcer objects for every unique twitch channel in the database
async function createAnnouncerObjects() {

  let twitchChannels = await getTwitchChannels();
  let announcers = twitchChannels.map(async twitchChannel => {
    return await createAnnouncerObject(twitchChannel);
  });

  return Promise.all(announcers);

}

// wrapper function that will take a discordChannel and twitch name
// and create an object that can be used to search the database
function getObjectForDB(discordChannel, twitchName) {

  let obj = {
    discord_guild_id: discordChannel.guild.id,
    discord_channel_id: discordChannel.id,
    twitch_channel_name: twitchName.toLowerCase()
  };

  return obj;

}


// returns an object for an entry from the database based on the 
// passed discord channel and twitch name 

async function getAnnounceEntry(discordChannel, twitchName) {

  let obj = getObjectForDB(discordChannel, twitchName);

  return await db.discord_announcers.findOne(obj);  

}


// wrapper function to set a specified value for a specified key
// in the database for the entry corresponding to the passed 
// discord channel and twitch name
async function setAnnounceProperty(discordChannel, twitchName, key, value) {
  
  let obj = getObjectForDB(discordChannel, twitchName);
  let change = {};
  change[key] = value;
  await db.discord_announcers.update(obj, change);

}


// function creates then loops through each announcer from the database
async function processAnnouncers() {

  let announcers = await createAnnouncerObjects();
  announcers.forEach(announcer => {
    announceAllDiscordChannels(announcer);
  });

}


// this big mess of a function takes an announcer as an argument
// and goes through each channel determining whether or not an
// announcement should be posted or not
function announceAllDiscordChannels(announcer) {
  
  announcer.announceChannels.forEach(async discordChannel => {

    let entry = await getAnnounceEntry(discordChannel, announcer.name);
    let notified = entry.announce_sent;
    let onCooldown = entry.on_cooldown;
    let offlineSince = entry.offline_since;
    let timeOffline = Math.abs(new Date() - offlineSince);


    // stream is live 
    console.log(announcer.name);
    console.log(timeOffline);
    console.log(offlineSince);
    console.log(announcer.isLive);
    if (announcer.isLive) {


      // stream has come back online, cancel cooldown
      if (onCooldown) {
        // console.log('Stream is back online, clearing cooldown!');
        setAnnounceProperty(
          discordChannel, announcer.name, 'on_cooldown', false);
      }

      // no announcment has been posted, send announcement
      if (!notified) {
        // console.log('Notification for ' + announcer.name + ' posted!!!');
        postMessage(discordChannel, announcer);
        setAnnounceProperty(
          discordChannel, announcer.name, 'announce_sent', true);
      }
      

    // stream is offline & has already been notified
    } else if (!announcer.isLive && notified) {
      console.log('Not live and notified');


      // no cooldown running, start cooldown and set offline_since
      if (!onCooldown) {
        // console.log('Starting cooldown!');
        setAnnounceProperty(
          discordChannel, announcer.name, 'on_cooldown', true);
        setAnnounceProperty(
          discordChannel, announcer.name, 'offline_since', new Date());
      
      // cooldown limit reached and still offline, set notified to false
      } else if (timeOffline > COOLDOWN && !announcer.isLive) {
        console.log('Cooldown finished and still offline, setting notified to false!');
        setAnnounceProperty(
          discordChannel, announcer.name, 'announce_sent', false);
        setAnnounceProperty(
          discordChannel, announcer.name, 'on_cooldown', false);
      
      }


    } else {
      console.log('I was returned');

      return;

    }

  });

}


// creates embed from twitch channel object, this is sent with our
// announce message to make it look pretty
function createEmbed(announcer) {
  
  let embed = new discord.RichEmbed();

  embed.setColor(3447003);
  embed.setAuthor(announcer.name + ' has started streaming!');
  embed.setTitle('Watch now on twitch.tv');
  embed.setURL('http://www.twitch.tv/' + announcer.name.toLowerCase());
  embed.addField('Now Playing:', announcer.game);
  embed.addField('Stream Title:', announcer.title);
  embed.setTimestamp(announcer.startTime);
  embed.setThumbnail(announcer.avatar);

  return embed;

}


// posts the actual message for the given discord and twitch channel
function postMessage(discordChannel, announcer) {
  
  let message = '@here Hey, ' + announcer.name +
  ' just went live! http://www.twitch.tv/' + announcer.name.toLowerCase();
  let embed = createEmbed(announcer);

  discordChannel.send(message, {embed});
}


module.exports = {
  start
};