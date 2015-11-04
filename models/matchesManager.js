function MatchesManager(){
  this.matches = [];
}

MatchesManager.prototype.addMatch = function(match) {
  this.matches.push(match);
};

MatchesManager.prototype.getMatch = function(matchID) { //ERROR: matchNotFound
  for(var i = 0; i < this.matches.length; i++){
    if(this.matches[i].id === matchID){
      return this.matches[i];
    }
  }
  return new Error('matchNotFound');
};

MatchesManager.prototype.removeMatch = function(matchID) {
  var removed = false;
  for(var i = 0; i < this.matches.length; i++){
    if(this.matches[i].id === matchID){
      var index = this.matches.indexOf(this.matches[i]);
      this.matches.splice(index, 1);
      removed = true;
    };
  };
  if(!removed){
    return new Error('match with id ' + matchID + ' not found');
  }
};


// Singelton to be exported
var manager = (function () {
  var instance;

  function createInstance() {
      var theManager = new MatchesManager();
      return theManager;
  }
  if (!instance) {
      instance = createInstance();
  }
  return instance;
})();


exports.manager = manager;
