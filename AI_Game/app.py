from flask import Flask, render_template, jsonify, request
import random
import json
import os
import time

app = Flask(__name__)

# In-memory debug log buffer for client messages (helps diagnosis during testing)
from collections import deque
DEBUG_LOGS = deque(maxlen=1000)

# Game state
game_state = {
    'snake': [],  # Will be initialized when game starts
    'apples': [],
    'direction': 'right',
    'next_direction': 'right',
    'score': 0,
    'time': 0,
    'game_over': False,
    'game_active': False,
    'width': 20,
    'height': 20,
    'speed': 3,  # blocks per second
}

settings = {
    'map_size': 'small',  # small (20), medium (40), large (80)
    'snake_color': 'blue',  # blue, red, green, yellow, purple, rainbow
    'speed': 'slow',  # slow (3), medium (5), fast (10)
    'random_controls': False,
    'invisible_snake': False,
    'background': 'white',
    'apples_count': 1,
    'last_direction': 'right',
}

MAP_SIZES = {
    'small': 20,
    'medium': 40,
    'large': 80,
}

SPEED_SETTINGS = {
    'slow': 3,
    'medium': 5,
    'fast': 10,
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    global settings, game_state
    
    if request.method == 'POST':
        data = request.json
        settings.update(data)
        
        # Reset game state with new settings
        size = MAP_SIZES[settings['map_size']]
        game_state['width'] = size
        game_state['height'] = size
        game_state['speed'] = SPEED_SETTINGS[settings['speed']]
        
        return jsonify({'status': 'success'})
    
    return jsonify(settings)

@app.route('/api/game/start', methods=['POST'])
def start_game():
    global game_state, settings
    
    size = MAP_SIZES[settings['map_size']]
    apples_count = int(settings.get('apples_count', 1))

    game_state = {
        'snake': [(size//2, size//2), (size//2 - 1, size//2)],
        'apples': [],
        'direction': 'right',
        'next_direction': 'right',
        'score': 0,
        'time': 0,
        'game_over': False,
        'game_active': True,
        'width': size,
        'height': size,
        'speed': SPEED_SETTINGS[settings['speed']],
    }
    
    spawn_apples(apples_count)
    return jsonify({'status': 'success'})

@app.route('/api/game/state', methods=['GET'])
def get_game_state():
    return jsonify({
        'snake': game_state['snake'],
        'apples': game_state.get('apples', []),
        'score': game_state['score'],
        'time': game_state['time'],
        'game_over': game_state['game_over'],
        'game_active': game_state['game_active'],
        'width': game_state['width'],
        'height': game_state['height'],
    })

@app.route('/api/game/move', methods=['POST'])
def move():
    global game_state, settings
    
    if not game_state['game_active'] or game_state['game_over']:
        return jsonify({'status': 'game_over'})
    
    data = request.json
    direction = data.get('direction')
    update_time = data.get('time', 0)
    
    # Apply random controls if enabled
    if settings['random_controls']:
        directions = ['up', 'down', 'left', 'right']
        direction = random.choice(directions)
    
    # Prevent moving backwards
    if is_valid_direction(direction):
        game_state['next_direction'] = direction
    
    # Update time
    game_state['time'] = update_time
    
    # Move snake
    head_x, head_y = game_state['snake'][0]
    
    if game_state['next_direction'] == 'up':
        head_y -= 1
    elif game_state['next_direction'] == 'down':
        head_y += 1
    elif game_state['next_direction'] == 'left':
        head_x -= 1
    elif game_state['next_direction'] == 'right':
        head_x += 1
    
    # Check collision with walls
    if head_x < 0 or head_x >= game_state['width'] or head_y < 0 or head_y >= game_state['height']:
        game_state['game_over'] = True
        game_state['game_active'] = False
        return jsonify({'status': 'collision_wall'})
    
    # Check collision with self
    if (head_x, head_y) in game_state['snake']:
        game_state['game_over'] = True
        game_state['game_active'] = False
        return jsonify({'status': 'collision_self'})
    
    # Add new head
    game_state['snake'].insert(0, (head_x, head_y))
    
    # Check if apple eaten (multiple apples)
    eaten = False
    for apple in list(game_state.get('apples', [])):
        if (head_x, head_y) == apple:
            eaten = True
            game_state['score'] += 1
            try:
                game_state['apples'].remove(apple)
            except ValueError:
                pass
            break
    
    if not eaten:
        # Remove tail if no apple eaten
        game_state['snake'].pop()
    else:
        # Spawn apples to maintain count
        desired = int(settings.get('apples_count', 1))
        spawn_apples(max(0, desired - len(game_state.get('apples', []))))
    
    # Check if no more room to move
    if len(game_state['snake']) > game_state['width'] * game_state['height']:
        game_state['game_over'] = True
        game_state['game_active'] = False
        return jsonify({'status': 'no_room'})
    
    game_state['direction'] = game_state['next_direction']
    
    return jsonify({'status': 'success'})

def is_valid_direction(direction):
    current = game_state['direction']
    
    if current == 'up' and direction == 'down':
        return False
    if current == 'down' and direction == 'up':
        return False
    if current == 'left' and direction == 'right':
        return False
    if current == 'right' and direction == 'left':
        return False
    
    return True

def spawn_apples(count=1):
    """Spawn `count` apples on empty blocks, ensuring they don't overlap the snake or existing apples."""
    empty_blocks = []

    occupied = set(game_state['snake']) | set(game_state.get('apples', []))

    for x in range(game_state['width']):
        for y in range(game_state['height']):
            if (x, y) not in occupied:
                empty_blocks.append((x, y))

    added = 0
    while added < count and empty_blocks:
        choice = random.choice(empty_blocks)
        game_state.setdefault('apples', []).append(choice)
        empty_blocks.remove(choice)
        added += 1

    # If there were no empty blocks left, leave apples as-is
    return

@app.route('/api/game/end', methods=['POST'])
def end_game():
    global game_state
    # Allow client to send final score/time so server can sync with client's local simulation
    data = request.json or {}
    if 'score' in data:
        try:
            game_state['score'] = int(data.get('score', game_state['score']))
        except Exception:
            pass
    if 'time' in data:
        try:
            game_state['time'] = int(data.get('time', game_state['time']))
        except Exception:
            pass

    game_state['game_active'] = False
    
    return jsonify({
        'score': game_state['score'],
        'time': game_state['time'],
    })

# Leaderboard persistence
LEADERBOARD_FILE = os.path.join(app.root_path, 'leaderboard.json')
LEADERBOARD_MAX = 10

def load_leaderboard():
    if os.path.exists(LEADERBOARD_FILE):
        try:
            with open(LEADERBOARD_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_leaderboard(lst):
    try:
        with open(LEADERBOARD_FILE, 'w') as f:
            json.dump(lst, f)
    except Exception:
        pass

@app.route('/api/leaderboard', methods=['GET', 'POST'])
def leaderboard():
    if request.method == 'GET':
        lst = load_leaderboard()
        return jsonify(lst)
    else:
        data = request.json or {}
        name = str(data.get('name', 'Player'))[:20]
        try:
            score = int(data.get('score', 0))
        except Exception:
            score = 0
        try:
            time_played = int(data.get('time', 0))
        except Exception:
            time_played = 0

        entry = {
            'name': name,
            'score': score,
            'time': time_played,
        }
        lst = load_leaderboard()
        lst.append(entry)
        lst = sorted(lst, key=lambda e: (-e.get('score',0), e.get('time',0)))[:LEADERBOARD_MAX]
        save_leaderboard(lst)
        return jsonify({'status': 'success', 'leaderboard': lst})

@app.route('/api/debug/hamiltonian')
def debug_hamiltonian():
    """Returns whether a Hamiltonian cycle is possible for the current map."""
    w = game_state.get('width', 30)
    h = game_state.get('height', 30)
    cycle_possible = (w % 2 == 0) or (h % 2 == 0)
    return jsonify({'width': w, 'height': h, 'cycle_possible': cycle_possible})


@app.route('/api/debug/log', methods=['POST'])
def debug_log():
    data = request.json or {}
    # log whatever the client posts for debugging
    try:
        # add a timestamped entry to the in-memory buffer for easy retrieval
        entry = {'ts': int(time.time()), 'data': data}
        DEBUG_LOGS.append(entry)
    except Exception:
        pass
    app.logger.info('JS-LOG: %s', data)
    return jsonify({'status': 'ok'})

@app.route('/api/debug/logs', methods=['GET'])
def get_debug_logs():
    # return recent client debug messages (JSON list)
    return jsonify(list(DEBUG_LOGS))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
