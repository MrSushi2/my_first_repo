# Cocktail Sort Simulation

A complete implementation of the Cocktail Sort (Cocktail Shaker Sort) algorithm with **interactive web-based visualization**, command-line tools, and comprehensive documentation.

## 🌐 Quick Start (Web Version)

**Run the Flask Web App:**

```bash
cd /workspaces/my_first_repo/cocktail_sort
pip install -r requirements.txt
python app.py
```

Then open your browser and navigate to: **http://localhost:5000**

Or use the startup script:
```bash
bash run.sh
```

## What is Cocktail Sort?

**Cocktail Sort** is a variation of bubble sort that sorts in both directions on each pass through the list. It's also known as:
- Cocktail Shaker Sort
- Bidirectional Bubble Sort
- Shaker Sort

### How It Works

1. **Forward Pass**: Compare adjacent elements from left to right, swapping if they're in wrong order
2. **Backward Pass**: Compare adjacent elements from right to left, swapping if they're in wrong order
3. Repeat until the array is sorted

This bidirectional approach can be more efficient than standard bubble sort because it moves elements toward their correct positions from both ends.

### Algorithm Visualization

```
Original: [5, 3, 8, 4, 2, 7, 1, 6]

Forward Pass (left to right):
→ 3, 5, 8, 4, 2, 7, 1, 6
→ 3, 5, 4, 8, 2, 7, 1, 6
→ 3, 5, 4, 2, 8, 7, 1, 6
→ 3, 5, 4, 2, 7, 8, 1, 6
→ 3, 5, 4, 2, 7, 1, 8, 6
→ 3, 5, 4, 2, 7, 1, 6, 8  ✓ Largest element in place

Backward Pass (right to left):
← 3, 5, 4, 2, 7, 1, 6, 8
← 3, 5, 4, 2, 1, 7, 6, 8
← 3, 5, 4, 1, 2, 7, 6, 8
← 3, 5, 1, 4, 2, 7, 6, 8
← 3, 1, 5, 4, 2, 7, 6, 8
← 1, 3, 5, 4, 2, 7, 6, 8  ✓ Smallest element in place

[Repeat until sorted...]
```

## Complexity Analysis

| Aspect | Complexity |
|--------|-----------|
| Best Case | O(n) - Already sorted |
| Average Case | O(n²) |
| Worst Case | O(n²) - Reverse sorted |
| Space Complexity | O(1) - In-place sorting |

## Features

✅ **Web-Based Visualizer** - Beautiful real-time bar animation
✅ **Step-by-Step Visualization** - Watch every comparison and swap
✅ **Live Statistics** - Track comparisons, swaps, and progress
✅ **Adjustable Speed** - Control animation speed (10-1000ms)
✅ **Custom/Random Arrays** - Test with your own data
✅ **Full Python Implementation** - Command-line tools included
✅ **Multiple Test Examples** - Try different scenarios
✅ **Comparison with Built-in Sort** - See performance metrics
✅ **Text-based Visualization** - No GUI required
✅ **Comprehensive Unit Tests** - 22 tests with 100% pass rate
✅ **Complete Documentation** - Algorithm guide and examples


## Usage

### 🌐 Web Interface (Recommended)

The interactive web visualizer provides real-time step-by-step animation with bars:

1. **Start the server:**
   ```bash
   python app.py
   ```

2. **Open browser:** http://localhost:5000

3. **Features:**
   - Real-time bar animation for each step
   - Adjustable animation speed (10-1000ms)
   - Custom array input or random generation
   - Live comparisons and swap counter
   - Progress bar showing sort completion
   - Color-coded bars (orange: comparing, red: swapping, green: sorted)

4. **API Endpoints:**
   - `POST /api/sort` - Sort array and get all steps
   - `POST /api/generate` - Generate random array
   
### 💻 Command Line Tools

**Basic example:**
```bash
cd /workspaces/my_first_repo/cocktail_sort
python cocktail_sort.py
```

The program will run 5 examples:
1. Simple array with detailed step-by-step visualization
2. Already sorted array
3. Reverse sorted array
4. Array with duplicate values
5. Comparison with Python's built-in sort

**Interactive testing:**
```bash
python interactive_test.py
```

Choose from options:
- Custom array input
- Random array generation
- Step-by-step visualization
- Performance analysis
- Batch testing

### Use in Your Own Code

```python
from cocktail_sort import cocktail_sort

# Basic usage
arr = [5, 3, 8, 4, 2, 7, 1, 6]
sorted_arr, swaps = cocktail_sort(arr.copy())
print(f"Sorted: {sorted_arr}, Swaps: {swaps}")

# With visualization
cocktail_sort(arr.copy(), visualize=True)
```

## Algorithm Pseudocode

```
function cocktailSort(arr):
    start = 0
    end = length(arr) - 1
    
    while start < end:
        # Forward pass
        for i from start to end-1:
            if arr[i] > arr[i+1]:
                swap(arr[i], arr[i+1])
        
        end = end - 1
        
        # Backward pass
        for i from end down to start+1:
            if arr[i-1] > arr[i]:
                swap(arr[i-1], arr[i])
        
        start = start + 1
    
    return arr
```

## When to Use Cocktail Sort

**Advantages:**
- Better performance than bubble sort on certain data patterns
- In-place sorting (minimal extra space)
- Stable sorting algorithm
- Easy to understand and implement

**Disadvantages:**
- Still O(n²) average case complexity
- Not practical for large datasets
- Slower than quicksort, mergesort, or heapsort

**Best Use Cases:**
- Educational purposes
- Small datasets
- Nearly sorted data
- When stability and simplicity are prioritized

## Files

### Web Application
- `app.py` - Flask server with sorting API
- `requirements.txt` - Python dependencies (Flask)
- `run.sh` - Startup script for easy launching
- `templates/index.html` - Web interface
- `static/css/style.css` - Styling
- `static/js/app.js` - Frontend JavaScript

### Command Line Tools
- `cocktail_sort.py` - Main implementation with examples
- `interactive_test.py` - Interactive testing tool
- `test_cocktail_sort.py` - Unit tests

### Documentation
- `README.md` - This file
- `ALGORITHM_GUIDE.md` - Comprehensive algorithm documentation
- `visualizer.html` - Standalone HTML visualizer (legacy)

## Time Complexity Examples

| Array Size | Worst Case | Typical Operations |
|------------|------------|-------------------|
| 10 elements | ~100 comparisons | 50-80 |
| 100 elements | ~10,000 comparisons | 3,000-7,000 |
| 1,000 elements | ~1,000,000 comparisons | 300,000-700,000 |

## References

- [Cocktail Sort - Wikipedia](https://en.wikipedia.org/wiki/Cocktail_shaker_sort)
- [Sorting Algorithms Visualization](https://www.cs.usfca.edu/~galles/visualization/ComparisonSort.html)

---

**Created**: March 2026
**Algorithm**: Cocktail Sort (Bidirectional Bubble Sort)
**Language**: Python 3
