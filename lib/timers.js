// Need to figure out a way to create individual cancelable timers for each
// channel in the database.

// I think creating an object and storing all the channels in the object at
// startup is the best way to do it.
var timers = {};

/*
The object could look something like this:

{
  #talutha: {
    offlineInterval: 20,
    onlineInterval: 5,
    timer: setInterval(addPointsOnTimerFunction, seeIfChannelOnlineAndSetTimeAccordingly)
  }
}

Then maybe we start the timer function when the channel starts. If a channel
goes online during the timer, we would need to cancel it and set a new timer.
I think an overall check should be done for every channel would be the easiest.

*/

exports.timers = timers;
