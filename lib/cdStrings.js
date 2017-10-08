'use strict';

/*
 
  Random strings for chicken dinner outcomes.

  @L = Loser
  @W = Winner
  @G = Weapon
  @P = Location(Place)

*/

const weapons = ['M24'];

const locations = ['School'];

const solo = [
  '@L died outside of the playzone.',
  '@L thought he was safe but somehow died to the red zone. No one dies to ' +
    'the red zone...',
  '@L tried doing a fancy flip on a motorcycle.  He failed.',
  '@L fell through the world.  Early Access.',
  '@L thought they were playing H1Z1 and jumped out of the UAZ too early.',
  '@L tried to throw a grenade at someone, unfortunately he held onto it ' +
    'for a little too long.'
];

const duo = [
  '@W ruthlessly guns down @L with an M416 at the Georgepol crates.',
  '@L thought he was safe going for a crate, but @W was waiting in the ' +
    'bushes with his silenced SKS.',
  '@L thought he was the king of the school, but @W showed him how wrong ' +
    'he was with an S12K to the face.',
  '@L didn\'t even hear the shot from @W\'s VSS.',
  '@W managed to shoot @L out of their Dacia before they got ran over.',
  '@L opened fire on @W with their M16.  Unfortunately @W\'s reaction time ' +
    'is just too good and killed @L with their Vector.',
  '@L didn\'t even hear the shot from @W\'s AWM.',
  'While looking in Zharki, @W stumbled across @L and managed to kill him ' +
    'with an UMP.',
  '@W managed to barely take out @L with a SCAR-L during a heated gunfight ' +
    'in Severny.',
  'In a desperate attempt to find any first aid, @L was searching around ' +
    'Stalber but all he found was the business end of @W\'s Groza.',
  '@L was just easy target practice for @W\'s M249 at the gun range.',
  '@W showed no mercy towards an unarmed @L completely tearing him apart ' +
    'in a close range fight at the Hospital with a Micro Uzi.',
  '@L attempted to cross into the military island.  Unfortunately ' +
    '@W was waiting on the bridge with an M249.'
    
];

module.exports = {
  solo,
  duo,
  weapons,
  locations
};