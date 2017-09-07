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
    sandbox.stub(TIMERS, 'showTimers').returns(channelObject);
  });

  afterEach( function() {
    sandbox.restore();
  });

  describe('Player Sorting', () => {

    beforeEach( function() {
      sandbox.stub(DB, 'db').returns({});
    });
    
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

      expect(stub.calledWith(channel, userstate, expected, gameState)).to.be.true;
    });
    
    it('should send player to lobby if gameState is lobby', async () => {
      
      sandbox.stub(POINTS, 'hasEnoughPoints').returns(true);
      channelObject[channel].chickenDinner.state = 'lobby';
      var stub = sandbox.stub(chickenDinner, 'lobby').returns(null);
      
      await chickenDinner.serve(channel, userstate, client, message);
      
      expect(stub.calledWith(channel, userstate, 100, gameState)).to.be.true;
    });

  });

  describe('Game Preparation', () => {

    beforeEach( function() {
      sandbox.stub(chickenDinner, 'changeState').returns(null);
      sandbox.stub(chickenDinner, 'resetPot').returns(null);
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
      let newState = null;

      await chickenDinner.prepare(channel, userstate, client, 100, gameState);

      expect(chickenDinner.lobby.calledWith(channel, userstate, 100, newState))
        .to.be.true;
    });

    it('should start a timer to announce when lobby is halfway done');

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
      sandbox.stub(DB, 'db').returns({});
      var amount = 100;
      var db = {};
      var userID = userstate['user-id'];

      await chickenDinner.addToPot(channel, userstate, amount, gameState);

      expect(stub.calledWith(db, channel, userID, amount)).to.be.true;
    });

    it('should add points to total');

  });
    
});