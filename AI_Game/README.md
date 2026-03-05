# AI Snake (Flask)

A browser-playable Snake game built with Python Flask and a responsive client-side renderer.

## Quick summary ✅
- Game is served by Flask (`app.py`).
- Core simulation (movement, collisions, apples) runs in the browser for smooth, low-latency gameplay.
- Settings (map size, speed, colors, difficulty toggles, apples count) are available from the main menu.

---

## How to run 🔧
1. Install Python 3 and pip if you don't already have them.
2. Install Flask:

   pip install flask

3. Run the app (from project root or inside AI_Game):

   python3 AI_Game/app.py

   OR

   cd AI_Game && python3 app.py

4. Open your browser and go to: http://localhost:5000

---

## How to play 🎮
- Start the game from the main menu ("START GAME").
- Controls: use WASD or Arrow Keys to move the snake.
- Eat apples (red) to grow and increase your score by 1 per apple.
- If the snake hits a wall or itself, the game ends and shows a Game Over screen with your final score and time.
- Use the Pause button to pause and resume the game.
- On the settings screen you can change the map size (30, 50, 75), snake color, speed (3, 5, 10 blocks/sec), toggle random controls and invisible snake, select background color and how many apples spawn at once.

---

## Performance optimizations ⚡
- Movement and collision detection now run entirely on the client to avoid network round-trips on every move.
- Rendering is throttled to ~30 FPS to reduce CPU usage for very large maps.

---

Enjoy! If you want additional features or further optimizations (sound, music, or server-side persistence of high scores), tell me and I can add them.

Leaderboards: A server-side leaderboard (top 10) was added. After a game ends you can submit your name and score to the leaderboard which is shown on both the main menu and the Game Over screen.

## Tests

Run unit tests (requires pytest):

- Install pytest: `pip install pytest`
- Run tests from project root:

  pytest AI_Game/tests -q

The tests assert the leaderboard API behavior, game start/state endpoints, and check that the client JS contains rainbow colors.