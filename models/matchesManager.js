"use strict";
function MatchesManager(){
  this.matches = [];
}

MatchesManager.prototype.getMatches = function(matchId) {
    return this.matches;
};

MatchesManager.prototype.getMatch = function(matchId) { //ERROR: matchNotFound
  let error = true;
  for(let i = 0; i < this.matches.length; i++){
    if(this.matches[i].id === matchId){
      error = false;
      return this.matches[i];
    }
  }
  if (error) {
    throw new Error('matchNotFound');
  }
};

MatchesManager.prototype.addMatch = function(match) {
  this.matches.push(match);
};

MatchesManager.prototype.removeMatch = function(match) {
  let index = this.matches.indexOf(match);
  if (index > -1) {
    this.matches.splice(index, 1);
  }
};

// Singelton
let manager = (function () {
  let instance;

  function createInstance() {
      let theManager = new MatchesManager();
      return theManager;
  }
  if (!instance) {
      instance = createInstance();
  }
  return instance;
})();


exports.manager = manager;
