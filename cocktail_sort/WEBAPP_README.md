# Cocktail Sort Web Visualizer Guide

## 🚀 Getting Started

### Installation & Running

**Quick Start:**

```bash
# Navigate to the project
cd /workspaces/my_first_repo/cocktail_sort

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

**Or use the startup script:**
```bash
bash run.sh
```

The server will start on **http://localhost:5000**

## 🌐 Web Interface Features

### Main Visualization

The web interface displays:

1. **Bar Chart Animation**
   - Each bar represents an array element's value
   - Height corresponds to the element's magnitude
   - Colors indicate the sorting state:
     - 🔵 Blue: Unsorted elements
     - 🟠 Orange: Currently comparing
     - 🔴 Red: Recently swapped
     - 🟢 Green: Sorted elements

2. **Live Statistics**
   - **Step**: Current animation step number
   - **Comparisons**: Total comparisons made
   - **Swaps**: Total swaps performed
   - **Status**: Current operation status

3. **Progress Bar**
   - Visual indicator of sorting completion
   - Updates as algorithm progresses

### Controls

#### Input Options

1. **Manual Input**
   ```
   Enter array as: 5 3 8 4 2 7 1 6
   Or: 5,3,8,4,2,7,1,6
   ```

2. **Random Generation**
   - Specify array size (5-50 elements)
   - Generates random values 1-100

#### Buttons

- **🎲 Random Array**: Generate a new random array
- **▶️ Sort**: Start/pause the sorting visualization
- **🔄 Reset**: Clear and restart

#### Animation Speed

Slider to adjust animation speed:
- 10ms: Very fast
- 200ms: Recommended (default)
- 1000ms: Very slow (great for learning)

## 📡 API Reference

The web app provides two REST endpoints:

### POST /api/sort

Sort an array and get all steps.

**Request:**
```json
{
    "array": [5, 3, 8, 4, 2]
}
```

**Response:**
```json
{
    "success": true,
    "original": [5, 3, 8, 4, 2],
    "sorted": [2, 3, 4, 5, 8],
    "total_comparisons": 8,
    "total_swaps": 4,
    "steps": [
        {
            "array": [5, 3, 8, 4, 2],
            "type": "initial",
            "comparing": [],
            "swapped": [],
            "sorted": [],
            "comparisons": 0,
            "swaps": 0
        },
        {
            "array": [5, 3, 8, 4, 2],
            "type": "comparing",
            "comparing": [0, 1],
            "swapped": [],
            "sorted": [],
            "comparisons": 1,
            "swaps": 0
        },
        ...
    ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/sort \
  -H "Content-Type: application/json" \
  -d '{"array": [5, 3, 8, 4, 2]}'
```

### POST /api/generate

Generate a random array.

**Request:**
```json
{
    "size": 15,
    "max_val": 100
}
```

**Response:**
```json
{
    "success": true,
    "array": [42, 17, 93, 8, 54, ...]
}
```

## 🎯 Usage Examples

### Example 1: Sort a Custom Array

1. Clear the input field
2. Enter: `9 2 6 5 3 5 8 6 7 2`
3. Click "▶️ Sort"
4. Watch the bars animate!

### Example 2: Test with Small Array

1. Enter: `3 1 2`
2. Set speed to 500ms
3. Click "▶️ Sort"
4. Observe each comparison and swap in detail

### Example 3: Large Random Array

1. Set array size to 40
2. Click "🎲 Random Array"
3. Click "▶️ Sort"
4. Watch performance on larger dataset

## 🔍 Understanding the Visualization

### Color Meanings

| Color | Meaning | Action |
|-------|---------|--------|
| 🔵 Blue | Normal | No current activity |
| 🟠 Orange | Comparing | Algorithm is comparing two elements |
| 🔴 Red | Swapping | Elements are being exchanged |
| 🟢 Green | Sorted | Element is in final position |

### Step Types

The visualization shows different step types:

- **initial**: Starting state before sorting
- **comparing**: Two elements being compared
- **swapped**: Elements just swapped
- **end_forward_pass**: Forward pass completed
- **end_backward_pass**: Backward pass completed
- **sorted**: Final sorted state

## 💡 Learning Tips

### Observe Patterns

1. **Bidirectional Movement**
   - Notice how largest elements move right
   - Notice how smallest elements move left

2. **Efficiency**
   - Compare with bubble sort mentally
   - See how both directions reduce iterations

3. **Swap Counts**
   - Already sorted arrays: 0 swaps
   - Reverse sorted arrays: Maximum swaps
   - Random arrays: Moderate swaps

### Experimental Tests

Try these arrays to understand the algorithm:

1. **Already Sorted**: `1 2 3 4 5`
   - Result: 0 swaps (best case)

2. **Reverse Sorted**: `5 4 3 2 1`
   - Result: Maximum swaps (worst case)

3. **Random**: `3 1 4 1 5 9 2 6`
   - Result: Average case performance

4. **Duplicates**: `3 3 3 1 1 2 2`
   - Demonstrates stable sorting

5. **Nearly Sorted**: `1 2 3 5 4 6 7 8`
   - Shows near-optimal performance

## 🐛 Troubleshooting

### Server Won't Start

```bash
# Make sure Flask is installed
pip install Flask==2.3.2

# Check if port 5000 is available
lsof -i :5000
```

### Page Not Loading

- Verify server is running: `curl http://localhost:5000/`
- Check browser console for errors (F12)
- Try refreshing the page

### API Errors

**Invalid Array**
```json
{"error": "Invalid array. Must be 1-100 elements."}
```

**Solution**: Enter array with 1-100 numbers

## 🏗️ Architecture

### Backend (Flask)

- `app.py`: Flask server and API endpoints
- `CocktailSortVisualizer`: Class that performs sorting and tracks steps
- Returns detailed step information for frontend animation

### Frontend (HTML/CSS/JS)

- `templates/index.html`: Main web page structure
- `static/css/style.css`: Styling and animations
- `static/js/app.js`: Frontend logic and visualization

### Data Flow

```
User Input → Parse Array
    ↓
Send to API (/api/sort)
    ↓
Backend: CocktailSortVisualizer
    ↓
Generate Steps with Details
    ↓
Return JSON to Frontend
    ↓
Animate Bars Through Steps
    ↓
Display Results
```

## 📊 Performance Metrics

The visualizer tracks:

- **Comparisons**: Count of element comparisons
- **Swaps**: Count of element exchanges
- **Time**: Real-time display of elapsed time
- **Progress**: Percentage of sorting completed

## 🎨 Customization

### Change Colors

Edit `static/css/style.css`:

```css
.bar {
    background: #667eea;  /* Change default color */
}

.bar.comparing {
    background: #f6ad55;  /* Change comparing color */
}

.bar.swapped {
    background: #f56565;  /* Change swap color */
}

.bar.sorted {
    background: #48bb78;  /* Change sorted color */
}
```

### Change Default Array

Edit `static/js/app.js`:

```javascript
let currentArray = [5, 3, 8, 4, 2, 7, 1, 6];  // Modify this
```

### Change Default Speed

Edit `templates/index.html`:

```html
<input type="range" id="speed" min="10" max="1000" value="200" />
                                                        <!-- Change 200 to your preference -->
```

## 🔗 Ports and URLs

- **Web Interface**: http://localhost:5000/
- **API - Sort**: http://localhost:5000/api/sort (POST)
- **API - Generate**: http://localhost:5000/api/generate (POST)

## 📝 Requirements

- Python 3.6+
- Flask 2.3.2
- Werkzeug 2.3.6

All dependencies are in `requirements.txt`

## 🎓 Educational Use

This visualizer is perfect for:

- Learning sorting algorithms
- Understanding algorithm visualization
- Teaching computer science concepts
- Comparing different sorting approaches
- Algorithm analysis and optimization

## 📱 Browser Support

Works on:
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Best viewed on desktop for full visualization experience.

## 🚀 Production Deployment

For production deployment:

1. Set `debug=False` in app.py
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Configure CORS if needed
4. Use environment variables for configuration
5. Add SSL/HTTPS support

## 📞 Support

For issues or questions:

1. Check troubleshooting section
2. Review ALGORITHM_GUIDE.md for algorithm details
3. Check browser console for error messages
4. Verify all dependencies are installed

---

**Created**: March 2026
**Version**: 1.0
**Technology**: Flask + Vanilla JavaScript
