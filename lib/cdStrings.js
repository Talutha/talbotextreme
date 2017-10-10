'use strict';

/*
 
  Random strings for chicken dinner outcomes.

  @L = Loser
  @W = Winner
  @G = Weapon
  @P = Location(Place)

*/

const weapons = ['AWM', 'M249', 'Mini 14', 'M24', 'SKS', 'Kar 98', 'Groza',
  'AKM', 'M416', 'SCAR-L', 'M16A4', 'S1897', 'Micro UZI', 'UMP9', 'S12k', 
  'Tommy Gun', 'S686', 'P18C', 'VSS', 'Vector', 'P92', 'P1911', 'R1895',
  'Crossbow'];

const locations = ['school', 'Georgepol', 'mansion', 'Lipovka', 'Gatka',
  'Zharki', 'Severny', 'Stalber', 'Kameshki', 'gun range', 'hospital', 'Rozhok',
  'Polyana', 'ruins', 'Pochinki', 'prison', 'quarry', 'farm', 'Mylta',
  'power plant', 'mini power', 'military base', 'Novorepnoye', 'Primorsk'];

const solo = [
  '@L died outside of the playzone.',
  '@L thought he was safe but somehow died to the red zone. No one dies to ' +
    'the red zone...',
  '@L tried doing a fancy flip on a motorcycle.  He failed.',
  '@L fell through the world.  Early Access.',
  '@L thought they were playing H1Z1 and jumped out of the UAZ too early.',
  '@L tried to throw a grenade at someone, unfortunately he held onto it ' +
    'for a little too long.',
  '@L made it all the way to Chernogorsk before realizing they were playing ' +
    'the wrong game and had to quit.'
];

const duo = [
  '@W ruthlessly guns down @L with their @G at the Georgepol crates.',
  '@L thought he was safe going for a crate, but @W was waiting in the ' +
    'bushes with his silenced SKS.',
  '@L thought he was the king of the school, but @W showed him how wrong ' +
    'he was with the @G to the face.',
  '@L didn\'t even hear the shot from @W\'s @G.',
  '@W managed to shoot @L out of their Dacia before they got ran over.',
  '@L opened fire on @W with their @G.  Unfortunately @W\'s reaction time ' +
    'is just too good and killed @L with their @G.',
  '@L didn\'t even hear the shot from @W\'s AWM.',
  'While looking in @P, @W stumbled across @L and managed to kill them ' +
    'with their @G.',
  '@W managed to barely take out @L with their @G during a heated gunfight ' +
    'in Severny.',
  'In a desperate attempt to find any first aid, @L was searching around ' +
    'Stalber but all he found was the business end of @W\'s @G.',
  '@L was just easy target practice for @W\'s @G at the gun range.',
  '@W showed no mercy towards an unarmed @L completely tearing him apart ' +
    'in a close range fight at @P with a @G.',
  '@L attempted to cross into the military island.  Unfortunately ' +
    '@W was waiting on the bridge with an M249.',
  'After a long battle at @P, @W finally managed to take down @L with their @G.',
  '@L was running to grab a level 3 helmet they saw at @P but @W gunned them ' +
    'down with their @G before they could get there.'
    
];

module.exports = {
  solo,
  duo,
  weapons,
  locations
};