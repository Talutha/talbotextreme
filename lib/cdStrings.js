'use strict';

/*
 
  Random strings for chicken dinner outcomes.

  @L = Loser
  @W = Winner

*/

const solo = [
  '@L died outside of the playzone.',
  '@L thought he was safe but somehow died to the red zone. No one dies to ' +
    ' the red zone...',
  '@L tried doing a fancy flip on a motorcycle.  He failed.',
  '@L fell through the world.  Early Access.'
];

const duo = [
  '@W ruthlessly guns down @L with an M416 at the Georgepol crates.',
  '@L thought he was safe going for a crate, but @W was waiting in the ' +
    'bushes with his silenced SKS.'
];

module.exports = {
  solo,
  duo
};