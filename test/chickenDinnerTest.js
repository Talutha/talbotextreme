var expect = require('chai').expect;
var sinon = require('sinon');

// mimic requirements for chickenDinner.js
var chickenDinner = require('../lib/chickenDinner.js');
var POINTS = require('../lib/points.js');
var DB = require('../lib/database.js');
var TIMERS = require('../lib/timers.js');

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
    sandbox.stub(DB, 'db').returns(null);
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
        
        var spy = sandbox.spy(chickenDinner, 'prepare');
        sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
        
        await chickenDinner.serve(channel, userstate, client, message);
        
        expect(spy.calledWith(channel, userstate, client, 100, gameState)).to.be.true;
      });
    
    it('should alert the chat if the game is on cooldown', async () => {
      
      channelObject[channel].chickenDinner.cooldown = true;
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var spy = sandbox.spy(client, 'say');
      var expected = 'The plane is currently refueling. !chickendinner ' + 
      'will be available again at the top of the hour!';
      
      await chickenDinner.serve(channel, userstate, client, message);
    
      expect(spy.calledWith(channel, expected)).to.be.true;
    });

    it('should not start a game if cooldown is active');

    it('should handle negative numbers as positive', async () => {
      gameState.state = 'lobby';
      message = ['chickendinner', '-100'];
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      var expected = 100;
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);

      await chickenDinner.serve(channel, userstate, client, message);

      expect(stub.calledWith(userstate, expected, gameState)).to.be.true;
    });
    
    it('should send player to lobby if gameState is lobby', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      channelObject[channel].chickenDinner.state = 'lobby';
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(stub.calledWith(userstate, 100, gameState)).to.be.true;
    });

  });

  describe('Game Preparation', () => {

    it('should set the gameState to lobby', async () => {
      var spy = sandbox.spy(chickenDinner, 'changeState');

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(spy.calledWith(gameState)).to.be.true;
    });

    it('should reset the pot to 0', async () => {
      var spy = sandbox.spy(chickenDinner, 'resetPot');
      var amount = 100;

      await chickenDinner.prepare(channel, userstate, client, amount, gameState);

      expect(spy.called).to.be.true;
    });

    it('should announce that a chicken dinner has started', async () => {
      var expected = `@${userstate['display-name']} has challenged ` + 
      'everyone to a "!chickendinner"! The battle begins in 5 minutes!';
      var spy = sandbox.spy(client, 'say');

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(spy.calledWith(channel, expected)).to.be.true;
    });

    it('should send the player to the lobby', async () => {
      var spy = sandbox.spy(chickenDinner, 'lobby');

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(spy.calledWith(userstate, 100, gameState)).to.be.true;
    });

    it('should start a timer to announce when lobby is halfway done');

  });

  describe('Game Lobby', () => {

    it('should add the player amount to the pot', async () => {
      var expected = 100;

      var result = await chickenDinner.lobby(userstate, 100, gameState);

      expect(result.pot.total).to.equal(expected);
    });

    it('should add all points to the pot', async () => {
      gameState.pot.total = 100;
      var expected = 250;
      var addThis = 150;

      var result = await chickenDinner.lobby(userstate, addThis, gameState);

      expect(result.pot.total).to.equal(expected);
    });
    
    it('should add the player to the participant list');

    it('should remove points from user total');

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
    
});