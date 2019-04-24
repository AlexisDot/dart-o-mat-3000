# General imports
import random

# Import flask dependencies
from flask import Blueprint, request, render_template

# Import the database and socketio object from the main app module
from app import db, socketio, IPADDR, PORT, RECOGNITION, SOUND

# Import module models
from app.mod_game.models import Game, Player, Score, Cricket, Round, Throw, CricketControl, PointsGained, ATC

# Import helper functions
from app.mod_game.helper import clear_db, score_x01, switch_next_player, get_playing_players_objects, \
    get_playing_players_id, get_score, get_active_player, get_average, get_throws_count, get_last_throws, \
    get_all_throws, update_throw_table, get_cricket, score_cricket, get_closed, get_checkout, score_atc

# Import Babel Stuff
from flask_babel import gettext

# Define the blueprint: 'game', set its url prefix: app.url/game
mod_game = Blueprint('game', __name__, url_prefix='/game')

# Dict for soundfiles
sounddict = {
    "0": "beep",
    "1": "beep",
    "2": "beep",
    "3": "beep",
    "4": "beep",
    "5": "beep",
    "6": "beep",
    "7": "beep",
    "8": "beep",
    "9": "beep",
    "10": "beep",
    "11": "beep",
    "12": "beep",
    "13": "beep",
    "14": "beep",
    "15": "beep",
    "16": "beep",
    "17": "beep",
    "18": "beep",
    "19": "beep",
    "20": "beep",
    "25": "bull",
    "50": "doublebull",
}

# Routes
@mod_game.route("/")
def index():
    return render_template('/game/index.html', ipaddr=IPADDR, port=PORT)


@mod_game.route("/admin/")
def admin():
    players = Player.query.all()
    return render_template('/game/admin.html', players=players)


@mod_game.route("/manageuser", methods=['GET', 'POST'])
def manageuser():
    # set Things
    created = False
    deleted = False
    players = Player.query.all()
    # If POST (coming from form)
    if request.method == 'POST':
        action = request.form["_action"]
        # Get Action and either add or delete
        if action == "add":
            name = request.form["username"]
            player = Player(name=name, active=False)
            db.session.add(player)
            db.session.commit()
            created = True
        # here comes delete
        elif action == "del":
            name = request.form["delusername"]
            player = Player.query.filter_by(name=name).first()
            db.session.delete(player)
            db.session.commit()
            deleted = True
        # if no action was given
        else:
            created = False
            deleted = False
        # render with fresh player list
        players = Player.query.all()
        return render_template('/game/manageuser.html', created=created, deleted=deleted, name=name, players=players)
    # This one will be taken if it is a GET request
    else:
        return render_template('/game/manageuser.html', created=created, deleted=deleted, players=players)


@mod_game.route("/gameController")
def game_controller():
    end_message = gettext(u"Really end game?")
    # Recognition [config.py]
    recognition = RECOGNITION
    # Playing Players
    playing_players = get_playing_players_objects()
    # Game
    game = Game.query.first()

    playerlist = []
    for player in playing_players:
        playerlist.append(str(player.id) + "," + str(player))

    active_player = get_active_player()

    # Get last throws
    last_throws = []
    for player in playing_players:
        last_throws.append(get_last_throws(player.id))

    # Scorelist
    scorelist = []
    for player in playing_players:
        score = Score.query.filter_by(player_id=player.id).first()
        scorelist.append(str(player) + "," + str(score.score))

    # ATC Settings
    active_player_number_to_hit = 0
    player_number_list = []
    if game.gametype == "ATC":
        active_player_number_to_hit = ATC.query.filter_by(player_id=active_player.id).first().number
        for player in playing_players:
            player_number_to_hit = ATC.query.filter_by(player_id=player.id).first().number
            player_number_list.append(str(player.name) + "," + str(player_number_to_hit))

        print("player_number_list is {}".format(player_number_list))

    # Draw Scoreboard
    socketio.emit("drawThrows", (playerlist, last_throws))

    if game.gametype == "ATC":
        socketio.emit("drawATC", active_player_number_to_hit)
        socketio.emit('highlightATC', (player_number_list, active_player.name))

    elif game.gametype == "Cricket":
        socketio.emit("drawCricketController")
        socketio.emit("highlightCricket", active_player.name)

    else:
        socketio.emit("drawX01Controller")
        socketio.emit("highlightAndScore", (active_player.name, scorelist))

    # Render Template
    return render_template(
        '/game/gameController.html',
        recognition=recognition,
        gametype=game.gametype,
        variant=game.variant,
        player_number_list=player_number_list,
        number=active_player_number_to_hit,
        playingPlayers=playerlist,
        activePlayer=active_player,
        scorelist=scorelist,
        throwlist=last_throws,
        end_message=end_message
    )


@mod_game.route("/scoreboardCricket")
def scoreboard_cricket(message=None, soundeffect=None):
    # Var for returning options
    if not soundeffect:
        audiofile = None
    else:
        audiofile = soundeffect
    if not message:
        message = "-"
    if "Winner" in message:
        audiofile = "winner"
        socketio.emit('rematchButton')
    elif "Sieger" in message:
        audiofile = "winner"
        socketio.emit('rematchButton')
    else:
        message = message
    # Check if sound is enabled [config.py]
    sound = SOUND
    # Get general data to draw scoreboard
    playing_players = get_playing_players_objects()
    playing_players_id = get_playing_players_id()
    active_player = get_active_player()

    # ActivePlayerThrowcount
    try:
        throwcount = get_throws_count(active_player.id)
    except AttributeError:
        throwcount = "0"

    # Get last throws to show in scoreboard beneath Message Container
    last_throws = []
    for player in playing_players:
        last_throws.append(get_last_throws(player.id))

    game = Game.query.first()

    try:
        rnd = len(Round.query.filter_by(player_id=active_player.id).all())
    except:
        rnd = 1

    player_cricket = []
    for player in playing_players:
        cricket_array = list()
        cricket_array.append(get_cricket(player.id).c15)
        cricket_array.append(get_cricket(player.id).c16)
        cricket_array.append(get_cricket(player.id).c17)
        cricket_array.append(get_cricket(player.id).c18)
        cricket_array.append(get_cricket(player.id).c19)
        cricket_array.append(get_cricket(player.id).c20)
        cricket_array.append(get_cricket(player.id).c25)
        player_cricket.append(cricket_array)

    scores = []
    for player in playing_players:
        score = Score.query.filter_by(player_id=player.id).first()
        scores.append(str(score.score))

    player_scores_list = [{'Player': str(name), 'PlayerID': str(playerid), 'Cricket': str(cricket), 'Score': str(score)}
                          for name, playerid, cricket, score
                          in zip(playing_players, playing_players_id, player_cricket, scores)]

    closed = get_closed()
    closed_list = []
    for x, y in closed.items():
        if y == "closed":
            closed_list.append(str(x))

    socketio.emit('drawScoreboardCricket', (player_scores_list, str(last_throws), closed_list))
    socketio.emit('highlightActiveCricket', (active_player.name, active_player.id, rnd, message, throwcount))

    if sound:
        socketio.emit('playSound', audiofile)

    return render_template(
        '/game/scoreboardCricket.html',
        playerlist=player_scores_list,
        throwcount=throwcount,
        lastthrows=last_throws,
        message=message,
        player=active_player.name,
        player_id=active_player.id,
        gametype=game.gametype,
        rndcount=rnd,
        variant=game.variant,
        closed=closed_list
    )


@mod_game.route("/scoreboardX01")
def scoreboard_x01(message=None, soundeffect=None):
    # Var for returning options
    if not message:
        message = "-"
    else:
        message = message
    if message == "Winner!":
        socketio.emit('rematchButton')
    elif message == "Sieger!":
        socketio.emit('rematchButton')

    if not soundeffect:
        audiofile = None
    else:
        audiofile = soundeffect
    # Check if sound is enabled [config.py]
    sound = SOUND
    # Get general data to draw scoreboard
    playing_players = get_playing_players_objects()
    playing_players_id = get_playing_players_id()
    active_player = get_active_player()
    # ActivePlayerThrowcount
    try:
        throwcount = get_throws_count(active_player.id)
    except AttributeError:
        throwcount = "0"
    # Get average
    try:
        average = get_average(active_player.id)
    except AttributeError:
        average = "0"

    # Get last throws to show in scoreboard beneath Message Container
    last_throws = []
    for player in playing_players:
        last_throws.append(get_last_throws(player.id))

    # Calculate Sum of Throws for Scoreboard
    sum_throws = []
    for item in last_throws:
        sum_of_throws = 0
        sum_id = ""
        try:
            for i in range(0, 3):
                split = item[i].split(",")
                hit = int(split[2])
                mod = int(split[3])
                count = hit * mod
                sum_of_throws += count
                sum_id = split[0]
            sum_throws.append(str(sum_id) + "," + str(sum_of_throws))
        except IndexError:
            sum_throws.append(str(item[0].split(",")[0]) + ",0")

    game = Game.query.first()
    try:
        rnd = len(Round.query.filter_by(player_id=active_player.id).all())
    except:
        rnd = 1

    player_scores = []
    for player in playing_players:
        player_scores.append(get_score(player.id))

    player_scores_list = [{'Player': str(name), 'PlayerID': str(playerid), 'Score': str(score)}
                          for name, playerid, score
                          in zip(playing_players, playing_players_id, player_scores)]

    # Get player checkout table
    if get_score(active_player.id) < 171:
        if not get_score(active_player.id) == 0:
            message = get_checkout(get_score(active_player.id))

    socketio.emit('drawScoreboardX01', (player_scores_list, last_throws, sum_throws))
    socketio.emit('highlightActive', (active_player.name, active_player.id, rnd, message, average, throwcount))
    if sound:
        socketio.emit('playSound', audiofile)

    return render_template(
        '/game/scoreboardX01.html',
        playerlist=player_scores_list,
        throwcount=throwcount,
        lastthrows=last_throws,
        throwsum=sum_throws,
        message=message,
        average=average,
        player=active_player.name,
        player_id=active_player.id,
        gametype=game.gametype,
        rndcount=rnd,
        startIn=game.inGame,
        exitOut=game.outGame
    )


@mod_game.route("/scoreboardATC")
def scoreboard_atc(message=None, soundeffect=None):
    # Var for returning options
    if not message:
        message = "-"
    else:
        message = message

    if not soundeffect:
        audiofile = None
    else:
        audiofile = soundeffect

    if message == "Winner!":
        audiofile = "winner"
        socketio.emit('rematchButton')
    elif message == "Sieger!":
        audiofile = "winner"
        socketio.emit('rematchButton')
    elif message == "Hit!":
        audiofile = "bull"
    elif message == "Getroffen":
        audiofile = "bull"

    # Check if sound is enabled [config.py]
    sound = SOUND
    # Get general data to draw scoreboard
    playing_players = get_playing_players_objects()
    playing_players_id = get_playing_players_id()
    active_player = get_active_player()
    # ActivePlayerThrowcount
    try:
        throwcount = get_throws_count(active_player.id)
    except AttributeError:
        throwcount = "0"

    # Get last throws to show in scoreboard beneath Message Container
    last_throws = []
    for player in playing_players:
        last_throws.append(get_last_throws(player.id))

    player_numbers = []
    for player in playing_players:
        player_numbers.append(ATC.query.filter_by(player_id=player.id).first())

    player_number_list = [{'Player': str(name), 'PlayerID': str(playerid), 'Number': str(number)}
                          for name, playerid, number
                          in zip(playing_players, playing_players_id, player_numbers)]

    game = Game.query.first()
    try:
        rnd = len(Round.query.filter_by(player_id=active_player.id).all())
    except:
        rnd = 1

    socketio.emit('drawScoreboardATC', player_number_list)
    socketio.emit('highlightATC', (active_player.name, rnd, throwcount, message))
    if sound:
        socketio.emit('playSound', audiofile)

    return render_template(
        '/game/scoreboardATC.html',
        playerlist=player_number_list,
        message=message,
        player=active_player.name,
        rndcount=rnd,
        throwcount=throwcount,
        gametype="Around the Clock",
        variant=game.variant,
    )


@mod_game.route("/throw/<int:hit>/<int:mod>")
def throw(hit, mod):
    game = Game.query.first()
    # Determine which sound to play
    audiofile = None
    if mod == 2:
        if hit == 25:
            audiofile = sounddict["50"]
        else:
            audiofile = sounddict[str(hit)]
    else:
        if hit in range(0, 26):
            audiofile = sounddict[str(hit)]

    # Lookup if next player has to be switched
    if game.nextPlayerNeeded:
        scoreboard_x01(gettext(u"Remove Darts"))
        scoreboard_cricket(gettext(u"Remove Darts"))
        scoreboard_atc(gettext(u"Remove Darts"))
        return gettext(u"Switch to next player first")
    else:
        if "01" in game.gametype:
            do_it = score_x01(hit, mod)
            # TODO Find a better way of doing with babel
            if do_it == "Winner!":
                audiofile = "winner"
            if do_it == "Sieger!":
                audiofile = "winner"
            if do_it == "Bust! Remove Darts!":
                audiofile = "bust"
            if do_it == "Überworfen! Darts entfernen!":
                audiofile = "bust"
            if do_it == "No Out possible! Remove Darts!":
                audiofile = "bust"
            if do_it == "Sieg nicht mehr möglich! Darts entfernen!":
                audiofile = "bust"
            if do_it == "Bust!":
                audiofile = "bust"
            scoreboard_x01(do_it, audiofile)
            game_controller()
            return do_it
        elif str(game.gametype) == "Cricket":
            do_it = score_cricket(hit, mod)
            if "Opened" in do_it:
                audiofile = "open"
            if "Geöffnet" in do_it:
                audiofile = "open"
            if "Closed" in do_it:
                audiofile = "close"
            if "Geschlossen" in do_it:
                audiofile = "close"
            scoreboard_cricket(do_it, audiofile)
            game_controller()
            return do_it
        elif str(game.gametype) == "ATC":
            do_it = score_atc(hit, mod)
            scoreboard_atc(do_it, audiofile)
            game_controller()
            return do_it
        else:
            return "Other Game Type"


@mod_game.route("/throw/update/<throw_id>/<new_hit>/<new_mod>")
def update_throw(throw_id, new_hit, new_mod):
    game = Game.query.first()
    update_throw_table(throw_id, new_hit, new_mod)
    if game.gametype == "Cricket":
        scoreboard_cricket(gettext(u"Throw updated"))
    elif "01" in game.gametype:
        scoreboard_x01(gettext(u"Throw updated"))
    elif game.gametype == "ATC":
        scoreboard_atc(gettext(u"Throw updated"))

    game_controller()
    return "-"


@mod_game.route("/nextPlayer")
def next_player():
    # Do the switch
    do_it = switch_next_player()
    # Get game object
    game = Game.query.first()
    # Get Sound
    sound = SOUND
    # Switch over what to do
    if game.gametype == "Cricket":
        scoreboard_cricket(do_it)
        if sound:
            socketio.emit("playSound", "startgame")

    elif game.gametype == "ATC":
        scoreboard_atc(do_it)
        if sound:
            socketio.emit("playSound", "startgame")

    else:
        scoreboard_x01(do_it)
        if sound:
            socketio.emit("playSound", "startgame")

    game_controller()
    return do_it


@mod_game.route("/endGame")
def end_game():
    clear_db()
    socketio.emit('redirectX01', "/game/")
    socketio.emit('redirectCricket', "/game/")
    socketio.emit('redirectATC', "/game/")
    socketio.emit('redirectGameController', "/game/admin")
    return gettext(u"Done")


@mod_game.route("/rematch")
def rematch():
    game = Game.query.first()
    players = get_playing_players_objects()
    game.won = 0
    scores = Score.query.all()
    for score in scores:
        score.score = score.initialScore
        score.parkScore = score.initialScore
    db.session.query(Throw).delete()
    db.session.query(Round).delete()
    db.session.query(Cricket).delete()
    db.session.query(CricketControl).delete()
    db.session.query(PointsGained).delete()
    db.session.query(ATC).delete()
    db.session.commit()
    if game.gametype == "Cricket":
        for player in players:
            p = Player.query.filter_by(id=player.id).first()
            c = Cricket(c20=0, c19=0, c18=0, c17=0, c16=0, c15=0, c25=0)
            p.crickets.append(c)
            db.session.add(p)
            db.session.add(c)
            db.session.commit()
        cc = CricketControl(c20="", c19="", c18="", c17="", c16="", c15="", c25="")
        db.session.add(cc)
        db.session.commit()
        scoreboard_cricket(gettext(u"Rematch"), "startgame")
        game_controller()
    elif game.gametype == "ATC":
        for player in players:
            atc = ATC(number=1)
            score = Score(score=0,parkScore=0,initialScore=0)
            p = Player.query.filter_by(name=player.name).first()
            p.numbers.append(atc)
            p.scores.append(score)
            db.session.add(p)
            db.session.add(score)
            db.session.add(atc)
            db.session.commit()
        scoreboard_atc(gettext(u"Rematch"), "startgame")
        game_controller()
    else:
        scoreboard_x01(gettext(u"Rematch"), "startgame")
        game_controller()
    return "-"


@socketio.on('startX01')
def on_start_x01(data):
    # Flush tables cause for now we handle only one active game
    clear_db()
    # Fill tables
    scorecount = int(data['x01variant'])
    g = Game(gametype=data['x01variant'], inGame=data['startIn'], outGame=data['exitOut'])
    for player in data['players']:
        s = Score(score=scorecount, parkScore=scorecount, initialScore=scorecount)
        p = Player.query.filter_by(name=player).first()
        g.players.append(p)
        p.scores.append(s)
        db.session.add(g)
        db.session.add(p)
        db.session.add(s)
        db.session.commit()
    # Determine start Player by random
    a = Player.query.filter_by(name=random.choice(data['players'])).first()
    a.active = True
    # Commit to DB
    db.session.add(a)
    db.session.commit()

    scoreboard_x01()
    game_controller()
    socketio.emit('redirectIndex', '/game/scoreboardX01')
    socketio.emit('redirectAdmin', '/game/gameController')


@socketio.on('startCricket')
def on_start_cricket(data):
    # Flush tables cause for now we handle only one active game
    clear_db()
    # Fill tables
    variant = data['variant']
    g = Game(gametype='Cricket', variant=variant)
    for player in data['players']:
        c = Cricket(c20=0, c19=0, c18=0, c17=0, c16=0, c15=0, c25=0)
        s = Score(score=0, parkScore=0, initialScore=0)
        p = Player.query.filter_by(name=player).first()
        g.players.append(p)
        p.crickets.append(c)
        p.scores.append(s)
        db.session.add(g)
        db.session.add(p)
        db.session.add(c)
        db.session.add(s)
        db.session.commit()
    # Determine start Player by random
    a = Player.query.filter_by(name=random.choice(data['players'])).first()
    a.active = True
    # CricketControl
    cc = CricketControl(c20="", c19="", c18="", c17="", c16="", c15="", c25="")
    # Commit to DB
    db.session.add(a)
    db.session.add(cc)
    db.session.commit()

    socketio.emit('redirectIndex', '/game/scoreboardCricket')
    socketio.emit('redirectAdmin', '/game/gameController')
    scoreboard_cricket()


@socketio.on('startATC')
def on_start_atc(data):
    # Flush tables
    clear_db()
    # Fill tables
    variant = data['variant']
    g = Game(gametype='ATC', variant=variant)
    for player in data['players']:
        atc = ATC(number=1)
        score = Score(score=0,parkScore=0,initialScore=0)
        p = Player.query.filter_by(name=player).first()
        g.players.append(p)
        p.numbers.append(atc)
        p.scores.append(score)
        db.session.add(g)
        db.session.add(p)
        db.session.add(score)
        db.session.add(atc)
        db.session.commit()
    # Determine start Player by random
    a = Player.query.filter_by(name=random.choice(data['players'])).first()
    a.active = True
    # Commit to DB
    db.session.add(a)
    db.session.commit()

    scoreboard_atc()
    game_controller()
    socketio.emit('redirectIndex', '/game/scoreboardATC')
    socketio.emit('redirectAdmin', '/game/gameController')


@socketio.on('redrawCricket')
def redraw_cricket(message):
    scoreboard_cricket(message)