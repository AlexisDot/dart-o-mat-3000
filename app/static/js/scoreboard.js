// Socket IO Settings and events
var socket = io.connect('http://' + document.domain + ':' + location.port);

socket.on('connect', function() {
  console.log('Websocket connected!');
});

socket.on('refresh', function() {
  window.location.reload(1);
});

socket.on('playSound', function(soundfile) {
  playSound(soundfile);
});

socket.on('drawScoreboardSplit', function(playerlist, lastthrows) {
  drawScoreboardSplit(playerlist, lastthrows);
});

socket.on('drawScoreboardATC', function(playerlist) {
  drawScoreboardATC(playerlist);
});

socket.on('drawScoreboardX01', function(list, lastthrowsall, throwsum) {
  drawScoreboardX01(list, lastthrowsall, throwsum);
});

socket.on('drawScoreboardCricket', function(cricketlist, lastthrows, closed) {
  drawScoreboardCricket(cricketlist, lastthrows, closed);
});

socket.on('highlightActiveCricket', function(player, playerID, round, message, throwcount) {
  highlightActiveCricket(player, playerID, round, message, throwcount);
});

socket.on('highlightActive', function(player, playerID, round, message, average, throwcount) {
  highlightActivePlayer(player, playerID, round, message, average, throwcount);
});

socket.on('highlightATC', function(activePlayer, rnd, throwcount, message) {
  highlightATC(activePlayer, rnd, throwcount, message);
});

socket.on('highlightSplit', function(activePlayer, rnd, throwcount, message) {
  highlightSplit(activePlayer, rnd, throwcount, message);
});

socket.on('redirectX01', function(url) {
  window.location.href = url;
});

socket.on('redirectCricket', function(url) {
  window.location.href = url;
});

socket.on('redirectATC', function(url) {
  window.location.href = url;
});

socket.on('redirectSplit', function(url) {
  window.location.href = url;
});

socket.on('drawPodiumX01', function(podium, word) {
  drawPodiumX01(podium, word);
});

socket.on('drawPodiumCricket', function(podium, word) {
  drawPodiumCricket(podium, word);
});

socket.on('drawPodiumATC', function(podium, word) {
  drawPodiumATC(podium, word);
});

socket.on('drawPodiumSplit', function(podium, word) {
  drawPodiumSplit(podium, word);
});

// Functions
function drawScoreboardX01(list, lastthrowsall, throwsum) {
  var tableBody = document.getElementById("score");
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  for (var item in list) {
    var scoreRow = document.createElement("tr");
    scoreRow.setAttribute("id", "player-" + list[item].PlayerID);
    scoreRow.setAttribute("class", "text-center");
    var nameTd = document.createElement("td");
    nameTd.setAttribute("name", "Player-" + list[item].Player);
    nameTd.setAttribute("id", "playerName-" + list[item].Player);
    nameTd.setAttribute("class", "text-left");
    nameTd.innerHTML = "<h2 id='playerName-" + list[item].Player + "'>" + list[item].Player + "</h1>";
    scoreRow.appendChild(nameTd);
    var scoreTd = document.createElement("td");
    scoreTd.setAttribute("name", "Score-" + list[item].Player);
    scoreTd.setAttribute("id", "playerScore-" + list[item].Player);
    scoreTd.innerHTML = "<h1 id='playerScore-" + list[item].Player + "' class='player-score'>" + list[item].Score + "</h1>";
    scoreRow.appendChild(scoreTd);
    var messageTd = document.createElement("td");
    messageTd.setAttribute("name", "Message-" + list[item].Player);
    messageTd.setAttribute("id", "playerMessage-" + list[item].Player);
    messageTd.setAttribute("class", "text-center player-message");
    messageTd.innerHTML = "-";
    scoreRow.appendChild(messageTd);
    // var throwDiv = document.createElement("div");
    // throwDiv.setAttribute("id", "Throws-" + list[item].PlayerID);
    // scoreRow.appendChild(throwDiv);
    var sumTd = document.createElement("td");
    sumTd.setAttribute("id", "Sum-" + list[item].PlayerID);
    sumTd.setAttribute("class", "text-right");
    sumTd.innerHTML = "";
    scoreRow.appendChild(sumTd);
    tableBody.appendChild(scoreRow);
  }

  var throwsCounted = 0;
  for (var item in lastthrowsall) {
    for (var item2 in lastthrowsall[item]) {
      var array = lastthrowsall[item][item2].split(",");
      sumTd = document.getElementById("Sum-" + array[0]);
      var throww = document.createElement("td");
      throww.setAttribute("class", "throw");
      var output = "";
      if (array[3] == "2") {
        output += "D";
      } else if (array[3] == "3") {
        output += "T";
      }
      output += array[2];
      throww.innerHTML = "<h2 class='playerThrow'>" + output + "</h2>";
      sumTd.before(throww);
    }
    throwsCounted = lastthrowsall[item].length;
    for (throwsCounted; throwsCounted < 3; throwsCounted++) {
      sumTd = document.getElementById("Sum-" + array[0]);
      var throww = document.createElement("td");
      throww.setAttribute("class", "throw");
      throww.innerHTML = "<h2 class='playerThrow'>-</h2>";
      sumTd.before(throww);
    }
  }



  for (var item in throwsum) {
    var array = throwsum[item].split(",");
    var td2 = document.getElementById("Sum-" + array[0]);
    while (td2.firstChild) {
      td2.removeChild(td2.firstChild);
    }
    sumTd = document.getElementById("Sum-" + array[0]);
    var sum = document.createElement("div");
    sum.setAttribute("class", "sum");
    sum.innerHTML = "<h2 id='playerSum' class='player-sum'>" + array[1] + "</h2>";
    sumTd.appendChild(sum);
  }
}

function highlightActivePlayer(activePlayer, playerID, playerRound, message, average, throwcount) {

  var activeRow = document.getElementById("playerName-" + activePlayer).parentElement;
  activeRow.setAttribute("class", "text-center active");
  var divActivePlayer = document.getElementById("header-activePlayer");
  divActivePlayer.innerHTML = activePlayer;
  var divRndcount = document.getElementById("header-rndcount");
  divRndcount.innerHTML = playerRound;
  var divAverage = document.getElementById("header-average");
  divAverage.innerHTML = average;
  var divThrowcount = document.getElementById("header-throwcount");
  divThrowcount.innerHTML = throwcount;
  if (message.toLowerCase().includes("winner")) {
    var messageTd = document.querySelector(".active").previousElementSibling.querySelector(".player-message");
    messageTd.innerHTML = message;
  } else {
    var messageTd = document.getElementsByName("Message-" + activePlayer);
    messageTd[0].innerHTML = message;
  }
  var activePlayerThrows = document.querySelectorAll(".active .playerThrow");
  var activeHeaderThrows = document.querySelectorAll("#header-active .throw");
  for (let i = 0; i < 3; i++) {
    activeHeaderThrows[i].innerHTML = activePlayerThrows[i].innerHTML;
  }
  var activePlayerScore = document.querySelector(".active .player-score");
  var activeHeaderScore = document.querySelector("#header-active .remaining-score");
  activeHeaderScore.innerHTML = activePlayerScore.innerHTML;
  var activePlayerSum = document.querySelector(".active .player-sum");
  var activeHeaderSum = document.querySelector("#header-active .sum");
  activeHeaderSum.innerHTML = activePlayerSum.innerHTML;
  var activePlayerMessage = document.querySelector(".active .player-message");
  var activeHeaderMessage = document.querySelector("#header-active .message");
  activeHeaderMessage.innerHTML = activePlayerMessage.innerHTML;
}

function playSound(soundfile) {
  if (soundfile != null) {
    var audio = new Audio('http://' + document.domain + ':' + location.port + '/static/sounds/' + soundfile + '.mp3');
    audio.play();
  }
}

function drawScoreboardCricket(list, lastthrows, closed) {
  // Format Lastthrows list
  lastthrows = lastthrows.substring(2);
  lastthrows = lastthrows.substring(0, lastthrows.length - 2);
  lastthrows = lastthrows.split("], [");
  var tableBody = document.getElementById("score");
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  var divCount = 0;
  for (var item in list) {
    if (divCount == 2) {
      var linebrakeDiv = document.createElement("div");
      linebrakeDiv.setAttribute("class", "w-100");
      tableBody.appendChild(linebrakeDiv);
      divCount = 0;
    }
    // create row for player
    var playerTr = document.createElement("tr");
    playerTr.setAttribute("id", "Cricket-Border-" + list[item].Player);
    // Write name to row
    var playerNameColumn = document.createElement("td");
    playerNameColumn.setAttribute("id", "playerNameColumn");
    playerNameColumn.innerHTML = "<h2 id='playerName'>" + list[item].Player + "</h2>";
    playerTr.appendChild(playerNameColumn);
    var scoreColumn = document.createElement("td");
    scoreColumn.setAttribute("id", "playerScoreColumn");
    scoreColumn.setAttribute("class", "text-center");
    scoreColumn.innerHTML = "<h2 id='playerScore'>" + list[item].Score + "</h2>";
    playerTr.appendChild(scoreColumn);
    // Create next table row with message field and numbers
    var messageColumn = document.createElement("td");
    messageColumn.setAttribute("id", "Message-" + list[item].Player);
    messageColumn.setAttribute("class", "text-center");
    playerTr.appendChild(messageColumn);
    var lastThrowsColumn;
    // Insert Last Throws in column
    var output = "";
    var playerLastThrows = lastthrows[item].split(", ");
    var throwsCounted = 0;
    for (var item2 in playerLastThrows) {
      lastThrowsColumn = document.createElement("td");
      lastThrowsColumn.setAttribute("class", "player-last-throws dark-column");
      var throwArray = playerLastThrows[item2].substring(1);
      throwArray = throwArray.substring(0, throwArray.length - 1);
      throwArray = throwArray.split(",");
      // throwArray[0] = playerID
      // throwArray[1] = hit
      // throwArray[2] = mod
      if (throwArray[3] == "2") {
        output += "D";
      } else if (throwArray[3] == "3") {
        output += "T";
      }
      output += throwArray[2];
      lastThrowsColumn.innerHTML = "<h2>" + output + "</h2>";
      playerTr.appendChild(lastThrowsColumn);
      output = "";
    }
    throwsCounted = playerLastThrows.length;
    for (throwsCounted; throwsCounted < 3; throwsCounted++) {
      lastThrowsColumn = document.createElement("td");
      lastThrowsColumn.setAttribute("class", "player-last-throws dark-column");
      lastThrowsColumn.innerHTML = "<h2>-</h2>";
      playerTr.appendChild(lastThrowsColumn);
    }
    // Cricket array for symbol row (and numbers later on)
    var cricketArray = list[item].Cricket;
    cricketArray = cricketArray.substring(1);
    cricketArray = cricketArray.substring(0, cricketArray.length - 1);
    // Split array
    // cricketArray[0] = 15
    // cricketArray[1] = 16
    // cricketArray[2] = 17
    // cricketArray[3] = 18
    // cricketArray[4] = 19
    // cricketArray[5] = 20
    // cricketArray[6] = 25
    cricketArray = cricketArray.split(", ");
    // append 15 to 20 symbol row
    for (i = 15; i < 22; i++) {
      var countColumn = document.createElement("td");
      countColumn.setAttribute("name", "c" + i);
      countColumn.setAttribute("class", "countColumn");
      if (cricketArray[i - 15] == 0) {
        countColumn.innerHTML = "<h2></h2>";
      } else if (cricketArray[i - 15] == 1) {
        countColumn.innerHTML = "<img src='../../static/img/hit-1.svg'/>";
      } else if (cricketArray[i - 15] == 2) {
        countColumn.innerHTML = "<img src='../../static/img/hit-2.svg'/>";
      } else {
        countColumn.innerHTML = "<img src='../../static/img/hit-3.svg'/>";
      }
      playerTr.appendChild(countColumn);
    }
    // append Bulls Symbol row
    countColumn.setAttribute("name", "c25");
    countColumn.setAttribute("class", "countColumn");
    if (cricketArray[6] == 0) {
      countColumn.innerHTML = "<h2></h2>";
    } else if (cricketArray[6] == 1) {
      countColumn.innerHTML = "<img src='../../static/img/hit-1.svg'/>";
    } else if (cricketArray[6] == 2) {
      countColumn.innerHTML = "<img src='../../static/img/hit-2.svg'/>";
    } else {
      countColumn.innerHTML = "<img src='../../static/img/hit-3.svg'/>";
    }
    playerTr.appendChild(countColumn);
    // Create score row and column


    // Append border Div
    tableBody.appendChild(playerTr);
    // Count linebrake up
    divCount += 1;
  }
  // // Fix layout if item in list is odd
  // if (isOdd(list.length)) {
  //     // create border div for dummy
  //     borderDiv = document.createElement("div");
  //     borderDiv.setAttribute("id", "Cricket-Border-Dummy");
  //     borderDiv.setAttribute("class", "col");
  //     // create dummy Table
  //     playerTable = document.createElement("table");
  //     playerTable.setAttribute("id", "playerTable-Dummy");
  //     borderDiv.appendChild(playerTable);
  //     tableBody.appendChild(borderDiv);
  // }

  // Closed marking
  // Loop through and search cXX and nXX
  for (var item in closed) {
    // var itemToChange = closed[item].substring(1).toString();
    var itemToChange = closed[item];
    // itemToChange = itemToChange.substring(0, itemToChange.length - 1);
    var elementListToChange = document.querySelectorAll("td[name=c" + itemToChange + "] img");
    for (i = 0; i < elementListToChange.length; i++) {
      elementListToChange[i].setAttribute("class", "closed");
    }
    elementListToChange = document.querySelectorAll("td[name=n" + itemToChange + "] img");
    for (i = 0; i < elementListToChange.length; i++) {
      elementListToChange[i].setAttribute("class", "closed");
    }
  }
}

function highlightActiveCricket(activePlayer, playerID, playerRound, message, throwcount) {
  var playerTr = document.getElementById("Cricket-Border-" + activePlayer);
  playerTr.style.border = '5px solid white';
  playerTr.style.boxShadow = '10px 10px 15px black';
  playerTr.setAttribute("class", "active");
  var divActivePlayer = document.getElementById("header-activePlayer");
  divActivePlayer.innerHTML = activePlayer;
  var divRndcount = document.getElementById("header-rndcount");
  divRndcount.innerHTML = playerRound;
  var divThrowcount = document.getElementById("header-throwcount");
  divThrowcount.innerHTML = throwcount;
  var messageColumn = document.getElementById("Message-" + activePlayer);
  messageColumn.innerHTML = "<span>" + message + "<span>";
  var activePlayerMessage = document.querySelector(".round-score-cricket .message");
  activePlayerMessage.innerHTML = message;
  var activePlayerThrows = document.querySelectorAll(".active .player-last-throws h2");
  var activeHeaderThrows = document.querySelectorAll("#header-active .throw");
  for (let i = 0; i < 3; i++) {
    activeHeaderThrows[i].innerHTML = activePlayerThrows[i].innerHTML;
  }
  var activePlayerCricketList = document.querySelectorAll(".active .countColumn");
  var activeHeaderCricketList = document.querySelectorAll("#header-active .count-row .countColumn");
  for (let i = 0; i < 7; i++) {
    activeHeaderCricketList[i].innerHTML = activePlayerCricketList[i].innerHTML;
  }
}

function drawScoreboardATC(list) {
  var div = document.getElementById("score");
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  for (var item in list) {
    var borderDiv = document.createElement("div");
    borderDiv.setAttribute("class", "col");
    borderDiv.setAttribute("id", "Border-" + list[item].Player);
    var nameDiv = document.createElement("div");
    nameDiv.setAttribute("name", "Player-" + list[item].Player);
    nameDiv.setAttribute("id", "playerName");
    nameDiv.innerHTML = "<h1 id='playerName'>" + list[item].Player + "</h1>";
    borderDiv.appendChild(nameDiv);
    var numberDiv = document.createElement("div");
    numberDiv.setAttribute("name", "Number-" + list[item].Player);
    numberDiv.setAttribute("id", "playerNumber");
    numberDiv.innerHTML = "<h1 id='playerNumber'>" + list[item].Number + "</h1>";
    borderDiv.appendChild(numberDiv);
    var messageDiv = document.createElement("div");
    messageDiv.setAttribute("name", "Message-" + list[item].Player);
    messageDiv.setAttribute("id", "playerMessage");
    messageDiv.innerHTML = "";
    borderDiv.appendChild(messageDiv);
    var throwDiv = document.createElement("div");
    throwDiv.setAttribute("id", "Throws-" + list[item].PlayerID);
    borderDiv.appendChild(throwDiv);
    div.appendChild(borderDiv);
  }
}

function highlightATC(activePlayer, playerRound, throwcount, message) {
  var borderDiv = document.getElementById("Border-" + activePlayer);
  borderDiv.style.border = '5px solid white';
  borderDiv.style.boxShadow = '10px 10px 15px black';
  var divActivePlayer = document.getElementById("header-activePlayer");
  divActivePlayer.innerHTML = activePlayer;
  var divRndcount = document.getElementById("header-rndcount");
  divRndcount.innerHTML = playerRound;
  var divThrowcount = document.getElementById("header-throwcount");
  divThrowcount.innerHTML = throwcount;
  var messageDiv = document.getElementsByName("Message-" + activePlayer);
  messageDiv[0].innerHTML = "<h1>" + message + "</h1>";
}

function drawScoreboardSplit(list, lastthrows) {
  var div = document.getElementById("score");
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  for (var item in list) {
    var borderDiv = document.createElement("div");
    borderDiv.setAttribute("class", "col");
    borderDiv.setAttribute("id", "Border-" + list[item].Player);
    var nameDiv = document.createElement("div");
    nameDiv.setAttribute("name", "Player-" + list[item].Player);
    nameDiv.setAttribute("id", "playerName");
    nameDiv.innerHTML = "<h1 id='playerName'>" + list[item].Player + "</h1>";
    borderDiv.appendChild(nameDiv);
    var scoreDiv = document.createElement("div");
    scoreDiv.setAttribute("name", "Score-" + list[item].Player);
    scoreDiv.setAttribute("id", "playerScore");
    scoreDiv.innerHTML = "<h1 id='playerScore'>" + list[item].Score + "</h1>";
    borderDiv.appendChild(scoreDiv);
    var messageDiv = document.createElement("div");
    messageDiv.setAttribute("name", "Message-" + list[item].Player);
    messageDiv.setAttribute("id", "playerMessage");
    messageDiv.innerHTML = "";
    borderDiv.appendChild(messageDiv);
    var throwDiv = document.createElement("div");
    throwDiv.setAttribute("id", "Throws-" + list[item].PlayerID);
    borderDiv.appendChild(throwDiv);
    var sumDiv = document.createElement("div");
    sumDiv.setAttribute("id", "Sum-" + list[item].PlayerID);
    sumDiv.innerHTML = "<h2 id='playerSum'>" + list[item].NextHit + "</h2>";
    borderDiv.appendChild(sumDiv);
    div.appendChild(borderDiv);
  }

  for (var item in lastthrows) {
    for (var item2 in lastthrows[item]) {
      var array = lastthrows[item][item2].split(",");
      throwDiv = document.getElementById("Throws-" + array[0]);
      var throww = document.createElement("div");
      throww.setAttribute("id", "throw");
      var output = "";
      if (array[3] == "2") {
        output += "D";
      } else if (array[3] == "3") {
        output += "T";
      }
      output += array[2];
      throww.innerHTML = "<h2 class='playerThrow'>" + output + "</h2>";
      throwDiv.appendChild(throww);
    }
  }
}

function highlightSplit(activePlayer, playerRound, throwcount, message) {
  var borderDiv = document.getElementById("Border-" + activePlayer);
  borderDiv.style.border = '5px solid white';
  borderDiv.style.boxShadow = '10px 10px 15px black';
  var divActivePlayer = document.getElementById("header-activePlayer");
  divActivePlayer.innerHTML = activePlayer;
  var divRndcount = document.getElementById("header-rndcount");
  divRndcount.innerHTML = playerRound;
  var divThrowcount = document.getElementById("header-throwcount");
  divThrowcount.innerHTML = throwcount;
  var messageDiv = document.getElementsByName("Message-" + activePlayer);
  messageDiv[0].innerHTML = "<h1>" + message + "</h1>";
}

function isOdd(num) {
  return num % 2;
}

function drawPodiumX01(podium, word) {
  if (podium) {
    for (var item in podium) {
      // array[0] = playerName
      // array[1] = podium place
      var array = podium[item].split(",");
      var scoreDiv = document.getElementsByName("Score-" + array[0]);
      scoreDiv[0].innerHTML = "<h1 id='playerScore-'" + array[0] + ">" + word + " " + array[1] + "</h1>";
    }
  }
}

function drawPodiumCricket(podium, word) {
  if (podium) {
    for (var item in podium) {
      // array[0] = playerName
      // array[1] = podium place
      var array = podium[item].split(",");
      var messageTD = document.getElementById("Message-" + array[0]);
      messageTD.innerHTML = "<h2>" + word + " " + array[1] + "</h2>";
    }
  }
}

function drawPodiumATC(podium, word) {
  if (podium) {
    for (var item in podium) {
      // array[0] = playerName
      // array[1] = podium place
      var array = podium[item].split(",");
      var messageDiv = document.getElementsByName("Message-" + array[0]);
      messageDiv[0].innerHTML = "<h1>" + word + " " + array[1] + "</h1>";
    }
  }
}

function drawPodiumSplit(podium, word) {
  for (var item in podium) {
    // array[0] = Name
    // array[1] = Podium Place
    var array = podium[item].split(",");
    var scoreDiv = document.getElementsByName("Score-" + array[0]);
    scoreDiv[0].innerHTML = "<h1 id='playerScore'>" + word + " " + array[1] + "</h1>";
  }
}
