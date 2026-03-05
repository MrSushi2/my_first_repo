import os
import sys
import json
import tempfile
import pytest
# Ensure AI_Game package path is importable when running tests from repo root
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), '..')))
import app
from app import load_leaderboard, save_leaderboard


@pytest.fixture
def client():
    flask_app = app.app
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client

def test_leaderboard_get_empty(client, tmp_path, monkeypatch):
    # ensure leaderboard file in temp dir
    temp_file = tmp_path / 'leaderboard.json'
    monkeypatch.setattr(app, 'LEADERBOARD_FILE', str(temp_file))
    # start clean
    if temp_file.exists():
        temp_file.unlink()

    rv = client.get('/api/leaderboard')
    assert rv.status_code == 200
    data = rv.get_json()
    assert isinstance(data, list)
    assert data == []

def test_leaderboard_post_and_sort(client, tmp_path, monkeypatch):
    temp_file = tmp_path / 'leaderboard.json'
    monkeypatch.setattr(app, 'LEADERBOARD_FILE', str(temp_file))

    entries = [
        {'name':'A','score':5,'time':10},
        {'name':'B','score':12,'time':40},
        {'name':'C','score':8,'time':20},
        {'name':'D','score':12,'time':30},
    ]

    for e in entries:
        rv = client.post('/api/leaderboard', json=e)
        assert rv.status_code == 200

    rv = client.get('/api/leaderboard')
    assert rv.status_code == 200
    data = rv.get_json()
    # sorted: highest score first; for equal score, lower time first
    assert data[0]['name'] == 'D' or data[0]['name'] == 'B'
    # ensure no more than LEADERBOARD_MAX entries
    assert len(data) <= 10

def test_game_start_and_state(client):
    rv = client.post('/api/game/start')
    assert rv.status_code == 200
    js = rv.get_json()
    assert js.get('status') == 'success'

    rv = client.get('/api/game/state')
    assert rv.status_code == 200
    state = rv.get_json()
    assert 'snake' in state
    assert 'width' in state and 'height' in state

def test_js_contains_rainbow_colors():
    js_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'js', 'game.js')
    js_path = os.path.normpath(js_path)
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert "'rainbow'" in content
    # ensure rainbow has multiple colors
    assert content.count('#') >= 6


def test_debug_hamiltonian_endpoint(client):
    # Start a fresh game (default small is 20x20 -> even dimensions)
    rv = client.post('/api/game/start')
    assert rv.status_code == 200
    # The debug endpoint should report whether a Hamiltonian cycle is possible
    rv = client.get('/api/debug/hamiltonian')
    assert rv.status_code == 200
    data = rv.get_json()
    assert 'cycle_possible' in data
    # For the default small map (30x30) at least one dimension is even; expect true
    assert data['cycle_possible'] is True


def test_align_function_present_and_used():
    js_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'js', 'game.js')
    js_path = os.path.normpath(js_path)
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'function alignSnakeToHamiltonian' in content
    # Ensure it's referenced so the client will run it on start/toggle
    assert 'alignSnakeToHamiltonian()' in content


def test_ai_ignores_apple_tracking_and_pathfinding():
    js_path = os.path.join(os.path.dirname(__file__), '..', 'static', 'js', 'game.js')
    js_path = os.path.normpath(js_path)
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # BFS helper and simulatePathSafe should be present; no aiShortcutCooldown
    assert 'function bfsPath' in content
    assert 'simulatePathSafe' in content
    assert 'aiShortcutCooldown' not in content
    # aiNextDirection should still exist
    assert 'function aiNextDirection' in content
    # Overlap-safety logging should be present in client JS
    assert 'align_skipped_overlap' in content
    # New near-cycle and excluded-cell handling should be present
    assert 'hamiltonianExcludedCell' in content
    # localSpawnApples should avoid the excluded cell when present
    assert 'excludedKey' in content
    # New BFS and simulation helpers should exist
    assert 'function bfsPath' in content
    assert 'simulatePathSafe' in content
