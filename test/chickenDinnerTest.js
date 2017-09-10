/*global it, describe, afterEach, beforeEach */

var expect = require('chai').expect;
var sinon = require('sinon');

// mimic requirements for chickenDinner.js
var chickenDinner = require('../lib/chickenDinner.js');
var POINTS = require('../lib/points.js');
var DB = require('../lib/database.js');
var TIMERS = require('../lib/timers.js');
var USERS = require('../lib/users.js');

describe('Chicken Dinner', () => {

  var channel, userstate, client, message, channelObject, gameState, sandbox;

  beforeEach( function() {
    channel = '#testchannel';
    userstate = {
      'display-name': 'Test-User',
      'user-id': 11111
    };
    client = {
      say: function () {}
    };
    channelObject = {
      '#testchannel': {
        chickenDinner: {
          activated: true,
          cooldown: false,
          state: 'available',
          pot: {
            total: 0,
            first: 0,
            second: 0,
            third: 0
          },
          participants: [],
          timer: function(func, time) {
            setTimeout( func, time);
          }
        }
      }
    };
    gameState = channelObject['#testchannel'].chickenDinner;
    message = ['chickendinner', '100'];
    sandbox = sinon.sandbox.create();
    sandbox.stub(DB, 'getDB').returns({});
    sandbox.stub(TIMERS, 'showTimers').returns(channelObject);
  });

  afterEach( function() {
    sandbox.restore();
  });

  describe('Player Sorting', () => {
    
    it('should return false if not enough points', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(false);

      var served = await chickenDinner.serve(channel, userstate, client, message);
      
      expect(served).to.be.false;
      
    });

    it('should not send player to lobby if not enough points', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(false);
      channelObject[channel].chickenDinner.state = 'lobby';
      var spy = sandbox.spy(chickenDinner, 'lobby');
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(spy.called).to.be.false;
    });

    it('should not send player to prepare if not enough points', async () => {

      sandbox.stub(POINTS, 'hasEnoughPoints').returns(false);
      var spy = sandbox.spy(chickenDinner, 'prepare');

      await chickenDinner.serve(channel, userstate, client, message);

      expect(spy.called).to.be.false;

    });
    
    it('return false if game state is in-progress', 
      async () => {
        
        sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
        channelObject[channel].chickenDinner.state = 'in-progress';
        
        var served = await chickenDinner.serve(channel, userstate, client, message);
        
        expect(served).to.be.false;
      });
    
    
    it('should prepare the game if state is available and user has enough points',
      async () => {
        
        var stub = sandbox.stub(chickenDinner, 'prepare').returns(null);
        sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
        
        await chickenDinner.serve(channel, userstate, client, message);
        
        expect(stub.calledWith(channel, userstate, client, 100, gameState)).to.be.true;
      });
    
    it('should alert the chat if the game is on cooldown', async () => {
      
      gameState.cooldown = true;
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var spy = sandbox.spy(client, 'say');
      var expected = 'The plane is currently refueling. !chickendinner ' + 
      'will be available again at the top of the hour!';
      
      await chickenDinner.serve(channel, userstate, client, message);
    
      expect(spy.calledWith(channel, expected)).to.be.true;
    });

    it('should not prepare a game if on cooldown', async () => {
      gameState.cooldown = true;
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var stub = sandbox.stub(chickenDinner, 'prepare').returns(null);

      await chickenDinner.serve(channel, userstate, client, message);

      expect(stub.called).to.be.false;
    });

    it('should not send a player to lobby if on cooldown', async () => {
      gameState.cooldown = true;
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);

      await chickenDinner.serve(channel, userstate, client, message);

      expect(stub.called).to.be.false;
    });

    it('should handle negative numbers as positive', async () => {
      gameState.state = 'lobby';
      message = ['chickendinner', '-100'];
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var expected = 100;
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);

      await chickenDinner.serve(channel, userstate, client, message);

      expect(stub.calledWith(channel, userstate, expected, gameState)).to.be.true;
    });
    
    it('should send player to lobby if gameState is lobby', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      channelObject[channel].chickenDinner.state = 'lobby';
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(stub.calledWith(channel, userstate, 100, gameState)).to.be.true;
    });

    it('send player to lobby if gamestate is lobby and cooldown is active', async () => {
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      gameState.state = 'lobby';
      gameState.cooldown = true;
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);

      await chickenDinner.serve(channel, userstate, client, message);

      expect(stub.calledWith(channel, userstate, 100, gameState)).to.be.true;
    });

  });

  describe('Game Preparation', () => {

    beforeEach( function() {
      sandbox.stub(chickenDinner, 'changeState').returns(gameState);
      sandbox.stub(chickenDinner, 'resetPot').returns(gameState);
      sandbox.stub(chickenDinner, 'lobby').returns(null);
    });

    it('should set the gameState to lobby', async () => {

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(chickenDinner.changeState.calledWith(gameState)).to.be.true;
    });

    it('should reset the pot to 0', async () => {
      var amount = 100;

      await chickenDinner.prepare(channel, userstate, client, amount, gameState);

      expect(chickenDinner.resetPot.called).to.be.true;
    });

    it('should announce that a chicken dinner has started', async () => {
      var expected = `@${userstate['display-name']} has challenged ` + 
      'everyone to a "!chickendinner"! The battle begins in 5 minutes!';
      var spy = sandbox.spy(client, 'say');

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(spy.calledWith(channel, expected)).to.be.true;
    });

    it('should send the player to the lobby', async () => {

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(chickenDinner.lobby.calledWith(channel, userstate, 100, gameState))
        .to.be.true;
    });

    it('should announce halfway message after a set time limit', async () => {
      var clock = sinon.useFakeTimers();
      sandbox.stub(client, 'say').returns(null);
      var stub = sandbox.stub(chickenDinner, 'halfWayPreparation').returns(null);

      chickenDinner.prepare(channel, userstate, client, 100, gameState);
      clock.tick(150000);

      expect(stub.calledWith(channel, client, gameState)).to.be.true;

      clock.restore();
    });

    it('should activate the cooldown', async () => {
      sandbox.stub(client, 'say').returns(gameState);
      sandbox.stub(gameState, 'timer').returns(null);
      
      chickenDinner.resetPot.returns(gameState);

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(gameState.cooldown).to.be.true;
    });

  });

  describe('Game Lobby', () => {

    it('should add the player amount to the pot', async () => {
      var stub = sandbox.stub(chickenDinner, 'addToPot').returns(null);
      sandbox.stub(chickenDinner, 'addParticipant').returns(null);

      await chickenDinner.lobby(channel, userstate, 100, gameState);

      expect(stub.called).to.equal(true);
    });
    
    it('should add the player to the participant list', async () => {
      var stub = sandbox.stub(chickenDinner, 'addParticipant').returns(null);
      sandbox.stub(chickenDinner, 'addToPot').returns(null);

      await chickenDinner.lobby(channel, userstate, 100, gameState);

      expect(stub.calledWith(userstate['user-id'], gameState)).to.be.true;
    });

  });

  describe('Game State', () => {

    it('should return lobby gamestate', async () => {
      var expected = 'lobby';

      var result = await chickenDinner.changeState(gameState, expected);
  
      expect(result.state).to.equal(expected);
    });

    it('should return in-progress gamestate', async () => {
      var expected = 'in-progress';

      var result = await chickenDinner.changeState(gameState, expected);

      expect(result.state).to.equal(expected);
    });

    it('should return available gamestate', async () => {
      var expected = 'available';

      var result = await chickenDinner.changeState(gameState, expected);

      expect(result.state).to.equal(expected);
    });

  });

  describe('Reset Pot', () => {
    
    it('should reset the pot to 0', () => {
      var expected = 0;
      gameState.pot.total = 250;

      var result = chickenDinner.resetPot(gameState);

      expect(result.pot.total).to.equal(expected);
    });

  });

  describe('Add to Pot', () => {

    it('should remove points from users total', async () => {
      var stub = sandbox.stub(POINTS,'modifyPoints').returns(null);
      var givenAmount = 100;
      var subAmount = -100;
      var db = {};
      var userID = userstate['user-id'];

      await chickenDinner.addToPot(channel, userstate, givenAmount, gameState);

      expect(stub.calledWith(db, channel, userID, subAmount)).to.be.true;
    });

    it('should add points to total', async () => {
      sandbox.stub(POINTS, 'modifyPoints').returns(null);
      var amount = 100;

      let result = await chickenDinner.addToPot(
        channel, userstate, amount, gameState
      );

      expect(result.pot.total).to.equal(amount);
    });

    it('should continue adding to total', async () => {
      sandbox.stub(POINTS, 'modifyPoints').returns(null);
      gameState.pot.total = 100;
      var amount = 150;
      var expected = 250;

      let result = await chickenDinner.addToPot(
        channel, userstate, amount, gameState
      );

      expect(result.pot.total).to.equal(expected);
    });

  });

  describe('Add Participant', function() {

    it('should add player to participants list', () => {
      var userID = userstate['user-id'];
      var expected = [userID];

      var result = chickenDinner.addParticipant(userID, gameState);

      expect(result.participants).to.deep.equal(expected);

    });

    it('should add second player to participants list', () => {
      var userID = 123456;
      var expected = [11111, 123456];
      gameState.participants.push(userstate['user-id']);

      var result = chickenDinner.addParticipant(userID, gameState);

      expect(result.participants).to.deep.equal(expected);
    });

  });

  describe('Half Way Preparation', function() {

    it('should tell players the remaining time to sign up', () => {
      var stub = sandbox.stub(client, 'say').returns(null);
      var expected = 'The battle for a !chickendinner will begin in ' + 
      '2 minutes and 30 seconds!';

      chickenDinner.halfWayPreparation(channel, client, gameState);

      expect(stub.calledWith(channel, expected)).to.be.true;
    });

    it('should call the game ready function/announcement after a set time', () => {
      var clock = sinon.useFakeTimers();
      sandbox.stub(client, 'say').returns(null);
      var stub = sandbox.stub(chickenDinner, 'battleReadyCheck').returns(null);

      chickenDinner.halfWayPreparation(channel, client, gameState);
      clock.tick(150000);

      expect(stub.calledWith(channel, client, gameState)).to.be.true;

      clock.restore();
    });

  });

  describe('Battle Ready Check', function () {

    beforeEach(function() {

      sandbox.stub(client, 'say').returns(null);
      sandbox.stub(chickenDinner, 'cancelGame').returns(null);
      sandbox.stub(chickenDinner, 'setRewards').returns(null);
      sandbox.stub(chickenDinner, 'fightRouting').returns(null);
      sandbox.stub(chickenDinner, 'changeState').returns(null);

    });

    it('should stop the game if there is only one participant', () => {
      gameState.participants = [11111]; 

      chickenDinner.battleReadyCheck(channel, client, gameState);

      expect(chickenDinner.cancelGame.called).to.be.true;
    });

    it('should not set rewards if there is only one participant', () => {
      gameState.participants = [11111];

      chickenDinner.battleReadyCheck(channel, client, gameState);

      expect(chickenDinner.setRewards.called).to.be.false;
    });

    it('should not cancel game if there are enough participants', () => {
      gameState.participants = [1, 2];

      chickenDinner.battleReadyCheck(channel, client, gameState);

      expect(chickenDinner.cancelGame.called).to.be.false;
    });

    it('should set the rewards if there are enough participants', () => {
      gameState.participants = [1, 2];

      chickenDinner.battleReadyCheck(channel, client, gameState);

      expect(chickenDinner.setRewards.called).to.be.true;
    });

    it('should announce battle is ready and results are soon', () => {
      gameState.participants = [1, 2];
      var expected = 'The battle for a !chickendinner has begun! '+ 
        'We should be receiving the first set of outcomes soon...';

      chickenDinner.battleReadyCheck(channel, client, gameState);

      expect(client.say.calledWith(channel, expected)).to.be.true;
    });

    it('should start fight after set time if enough participants', () => {
      gameState.participants = [1, 2];
      var clock = sinon.useFakeTimers();

      chickenDinner.battleReadyCheck(channel, client, gameState);
      clock.tick(150000);

      expect(chickenDinner.fightRouting.calledWith(channel, client, gameState))
        .to.be.true;
      clock.restore();
    });

    it('should set status to in-progress if enough participants', () => {
      gameState.participants = [1, 2];

      chickenDinner.battleReadyCheck(channel, client, gameState);

      expect(chickenDinner.changeState.calledWith(gameState, 'in-progress'))
        .to.be.true;
    });

  });

  describe('Cancel Game', () => {

    beforeEach(function () {
      sandbox.stub(client, 'say').returns(null);
      sandbox.stub(POINTS, 'modifyPoints').returns(null);
      sandbox.stub(POINTS, 'getPointsName').returns('Points');
      
    });

    it('should give reason why game was stopped', async () => {
      var pointsName = 'Points';
      var expected = 'Unfortunately there were not enough people ' +
        `signed up for !chickendinner. ${pointsName} have been refunded.`;

      await chickenDinner.cancelGame(channel, client, gameState);

      expect(client.say.calledWith(channel, expected)).to.be.true;
    });

    it('should reset the cooldown', async () => {
      gameState.cooldown = true;

      await chickenDinner.cancelGame(channel, client, gameState);

      expect(gameState.cooldown).to.be.false;
    });

    it('should refund points back to the participant', async () => {
      gameState.participants = [1];
      gameState.pot.total = 100;
      var userID = 1;
      var amount = 100;
      var db = {};

      await chickenDinner.cancelGame(channel, client, gameState);
      
      expect(POINTS.modifyPoints.calledWith(db, channel, userID, amount))
        .to.be.true;
    });

  });

  describe('Set Rewards', () => {

    it('should remove set amount from pot as house cut', () => {
      gameState.pot.total = 100;
      var expected = 90;

      chickenDinner.setRewards(gameState);

      expect(gameState.pot.total).to.equal(expected);
    });

    it('should remove set amount from post as house cut(2)', () => {
      gameState.pot.total = 1000;
      var expected = 900;

      chickenDinner.setRewards(gameState);

      expect(gameState.pot.total).to.equal(expected);
    });

    it('should set first place to 50%', () => {
      gameState.pot.total = 100;
      var expected = 45;

      chickenDinner.setRewards(gameState);

      expect(gameState.pot.first).to.equal(expected);
    });

    it('should set second place to 30%', () => {
      gameState.pot.total = 100;
      var expected = 27;

      chickenDinner.setRewards(gameState);

      expect(gameState.pot.second).to.equal(expected);
    });

    it('should set third place to 20%', () => {
      gameState.pot.total = 100;
      var expected = 18;

      chickenDinner.setRewards(gameState);

      expect(gameState.pot.third).to.equal(expected);
    });

  });

  describe('Get Percentage', () => {

    it('should return 10% of 100', () => {
      let perc = 10;
      let amount = 100;
      let expected = 10;

      let result = chickenDinner.getPercentage(perc, amount);

      expect(result).to.equal(expected);
    });

    it('should return 20% of 100', () => {
      let perc = 20;
      let amount = 100;
      let expected = 20;

      let result = chickenDinner.getPercentage(perc, amount);

      expect(result).to.equal(expected);
    });

    it('should return 100% of 100', () => {
      let perc = 100;
      let amount = 100;
      let expected = 100;

      let result = chickenDinner.getPercentage(perc, amount);

      expect(result).to.equal(expected);
    });

  });

  describe('Current Fight', function() {

    it('should call fight outcome for 4+ participants');

    it('should NOT call for reward if 4+ participants');

    it('should call itself after set time if 4+ participants');

    it('should call fight outcome for 3 participants');

    it('should call for reward once if 3 participants');

    it('should call fight outcome for 2 participants');

    it('should call itself after set time if 3 participants');

    it('should call for reward twice if 2 participants');

  });
    
});