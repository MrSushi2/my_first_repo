"""
Cocktail Sort Web Application with Step-by-Step Visualization
Flask server that provides real-time sorting visualization
"""

from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

class SortVisualizer:
    """Base class for sorting algorithm visualization."""
    
    def __init__(self, arr):
        self.original_array = arr.copy()
        self.array = arr.copy()
        self.steps = []
        self.comparisons = 0
        self.swaps = 0
        
    def get_step(self, state_type, comparing=None, swapped=None, sorted_indices=None):
        """Create a step object for visualization."""
        return {
            'array': self.array.copy(),
            'type': state_type,
            'comparing': comparing or [],
            'swapped': swapped or [],
            'sorted': sorted_indices or [],
            'comparisons': self.comparisons,
            'swaps': self.swaps
        }


class CocktailSortVisualizer(SortVisualizer):
    """Cocktail sort with step tracking for visualization."""
    
    def sort(self):
        """Perform cocktail sort and record all steps."""
        self.steps = []
        self.comparisons = 0
        self.swaps = 0
        
        # Initial state
        self.steps.append(self.get_step('initial'))
        
        n = len(self.array)
        start = 0
        end = n - 1
        sorted_indices = set()
        
        while start < end:
            # Forward pass
            for i in range(start, end):
                self.comparisons += 1
                # Record comparison step
                self.steps.append(self.get_step('comparing', comparing=[i, i + 1], sorted_indices=list(sorted_indices)))
                
                if self.array[i] > self.array[i + 1]:
                    self.array[i], self.array[i + 1] = self.array[i + 1], self.array[i]
                    self.swaps += 1
                    # Record swap step
                    self.steps.append(self.get_step('swapped', swapped=[i, i + 1], sorted_indices=list(sorted_indices)))
            
            sorted_indices.add(end)
            end -= 1
            
            if start >= end:
                break
            
            # Backward pass
            for i in range(end, start, -1):
                self.comparisons += 1
                # Record comparison step
                self.steps.append(self.get_step('comparing', comparing=[i - 1, i], sorted_indices=list(sorted_indices)))
                
                if self.array[i - 1] > self.array[i]:
                    self.array[i - 1], self.array[i] = self.array[i], self.array[i - 1]
                    self.swaps += 1
                    # Record swap step
                    self.steps.append(self.get_step('swapped', swapped=[i - 1, i], sorted_indices=list(sorted_indices)))
            
            sorted_indices.add(start)
            start += 1
        
        # Final sorted state
        self.steps.append(self.get_step('sorted', sorted_indices=list(range(len(self.array)))))
        return self.steps


class BubbleSortVisualizer(SortVisualizer):
    """Bubble sort with step tracking."""
    
    def sort(self):
        """Perform bubble sort and record all steps."""
        self.steps = []
        self.comparisons = 0
        self.swaps = 0
        
        self.steps.append(self.get_step('initial'))
        
        n = len(self.array)
        sorted_indices = set()
        
        for i in range(n):
            for j in range(0, n - i - 1):
                self.comparisons += 1
                # Record comparison step
                self.steps.append(self.get_step('comparing', comparing=[j, j + 1], sorted_indices=list(sorted_indices)))
                
                if self.array[j] > self.array[j + 1]:
                    self.array[j], self.array[j + 1] = self.array[j + 1], self.array[j]
                    self.swaps += 1
                    # Record swap step
                    self.steps.append(self.get_step('swapped', swapped=[j, j + 1], sorted_indices=list(sorted_indices)))
            
            sorted_indices.add(n - i - 1)
            self.steps.append(self.get_step('sorted', sorted_indices=list(sorted_indices)))
        
        self.steps.append(self.get_step('sorted', sorted_indices=list(range(n))))
        return self.steps


class InsertionSortVisualizer(SortVisualizer):
    """Insertion sort with step tracking."""
    
    def sort(self):
        """Perform insertion sort and record all steps."""
        self.steps = []
        self.comparisons = 0
        self.swaps = 0
        
        self.steps.append(self.get_step('initial'))
        n = len(self.array)
        sorted_indices = set([0])
        
        for i in range(1, n):
            key = self.array[i]
            j = i - 1
            
            while j >= 0:
                self.comparisons += 1
                # Record comparison step
                self.steps.append(self.get_step('comparing', comparing=[j, j + 1], sorted_indices=list(sorted_indices)))
                
                if self.array[j] > key:
                    self.array[j + 1] = self.array[j]
                    self.swaps += 1
                    # Record shift step
                    self.steps.append(self.get_step('swapped', swapped=[j, j + 1], sorted_indices=list(sorted_indices)))
                    j -= 1
                else:
                    break
            
            self.array[j + 1] = key
            sorted_indices.add(i)
            self.steps.append(self.get_step('sorted', sorted_indices=list(sorted_indices)))
        
        self.steps.append(self.get_step('sorted', sorted_indices=list(range(len(self.array)))))
        return self.steps


class SelectionSortVisualizer(SortVisualizer):
    """Selection sort with step tracking for visualization."""
    
    def sort(self):
        """Perform selection sort and record all steps."""
        self.steps = []
        self.comparisons = 0
        self.swaps = 0
        
        self.steps.append(self.get_step('initial'))
        n = len(self.array)
        sorted_indices = set()
        
        for i in range(n):
            min_idx = i
            
            # Find minimum without recording comparison steps
            for j in range(i + 1, n):
                self.comparisons += 1
                
                if self.array[j] < self.array[min_idx]:
                    min_idx = j
            
            # Only record step if we actually swap
            if min_idx != i:
                self.array[i], self.array[min_idx] = self.array[min_idx], self.array[i]
                self.swaps += 1
                # Record swap with the indices involved
                self.steps.append(self.get_step('swapped', swapped=[i, min_idx], sorted_indices=list(sorted_indices)))
            
            # Mark this position as sorted
            sorted_indices.add(i)
            self.steps.append(self.get_step('sorted', sorted_indices=list(sorted_indices)))
        
        self.steps.append(self.get_step('sorted', sorted_indices=list(range(len(self.array)))))
        return self.steps


class QuickSortVisualizer(SortVisualizer):
    """Quick sort with step tracking for visualization."""
    
    def sort(self):
        """Perform quick sort and record all steps."""
        self.steps = []
        self.comparisons = 0
        self.swaps = 0
        self.sorted_indices = set()
        self.array_size = len(self.array)
        # Adaptive sampling - less aggressive for better visual quality
        if self.array_size <= 100:
            self.sample_rate = 1
        elif self.array_size <= 500:
            self.sample_rate = max(1, self.array_size // 25)
        else:
            self.sample_rate = max(1, self.array_size // 20)
        
        self.steps.append(self.get_step('initial'))
        self._quick_sort(0, len(self.array) - 1)
        self.steps.append(self.get_step('sorted', sorted_indices=list(range(len(self.array)))))
        return self.steps
    
    def _quick_sort(self, low, high):
        """Recursive quick sort helper."""
        if low < high:
            pi = self._partition(low, high)
            self._quick_sort(low, pi - 1)
            self._quick_sort(pi + 1, high)
        else:
            self.sorted_indices.add(low)
    
    def _partition(self, low, high):
        """Partition helper for quick sort."""
        pivot = self.array[high]
        i = low - 1
        
        for j in range(low, high):
            self.comparisons += 1
            
            if self.array[j] < pivot:
                i += 1
                self.array[i], self.array[j] = self.array[j], self.array[i]
                self.swaps += 1
                # Sample steps based on array size
                if self.swaps % self.sample_rate == 0:
                    self.steps.append(self.get_step('swapped', swapped=[i, j], sorted_indices=list(self.sorted_indices)))
        
        self.array[i + 1], self.array[high] = self.array[high], self.array[i + 1]
        self.swaps += 1
        # Sample steps based on array size
        if self.swaps % self.sample_rate == 0:
            self.steps.append(self.get_step('swapped', swapped=[i + 1, high], sorted_indices=list(self.sorted_indices)))
        return i + 1


@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')


def filter_steps_for_performance(steps, array_size, is_compare_mode=False):
    """
    Filter steps based on array size and compare mode for performance.
    Keep enough steps for visual quality while reducing animation time.
    """
    if len(steps) <= 50:
        return steps  # Don't filter small step arrays
    
    # Determine filtering ratio based on array size and compare mode
    if array_size > 500:
        # Very large arrays: keep 1 in every 5-10 steps
        keep_ratio = 5 if is_compare_mode else 3
    elif array_size > 250:
        # Large arrays: keep 1 in every 3-5 steps
        keep_ratio = 4 if is_compare_mode else 2
    else:
        # Normal arrays: keep all or most steps
        keep_ratio = 2 if is_compare_mode else 1
    
    if keep_ratio == 1:
        return steps
    
    # Always keep first (initial) and last (sorted) steps
    filtered = [steps[0]]  # Keep initial state
    
    # Keep sample of middle steps
    for i in range(1, len(steps) - 1, keep_ratio):
        filtered.append(steps[i])
    
    # Always keep final sorted state
    filtered.append(steps[-1])
    
    return filtered


@app.route('/api/sort', methods=['POST'])
def sort_array():
    """API endpoint to sort an array and return all steps."""
    try:
        data = request.json
        array = data.get('array', [])
        algorithm = data.get('algorithm', 'cocktail')
        compare_mode = data.get('compare', False)
        algorithm2 = data.get('algorithm2', 'bubble')
        
        # Validate input
        if not array or len(array) > 1000:
            return jsonify({'error': 'Invalid array. Must be 1-1000 elements.'}), 400
        
        array_size = len(array)
        
        # Select sorting algorithm
        visualizer_class = {
            'cocktail': CocktailSortVisualizer,
            'bubble': BubbleSortVisualizer,
            'insertion': InsertionSortVisualizer,
            'selection': SelectionSortVisualizer,
            'quick': QuickSortVisualizer,
        }.get(algorithm, CocktailSortVisualizer)
        
        # Perform sort
        visualizer = visualizer_class(array)
        steps = visualizer.sort()
        
        # Filter steps based on size and compare mode
        filtered_steps = filter_steps_for_performance(steps, array_size, compare_mode)
        
        response = {
            'success': True,
            'original': visualizer.original_array,
            'sorted': visualizer.array,
            'steps': filtered_steps,
            'total_comparisons': visualizer.comparisons,
            'total_swaps': visualizer.swaps,
            'algorithm': algorithm
        }
        
        # If comparison mode, also sort with second algorithm
        if compare_mode and algorithm != algorithm2:
            visualizer2_class = {
                'cocktail': CocktailSortVisualizer,
                'bubble': BubbleSortVisualizer,
                'insertion': InsertionSortVisualizer,
                'selection': SelectionSortVisualizer,
                'quick': QuickSortVisualizer,
            }.get(algorithm2, BubbleSortVisualizer)
            
            visualizer2 = visualizer2_class(array)
            steps2 = visualizer2.sort()
            
            # More aggressive filtering for compare mode
            filtered_steps2 = filter_steps_for_performance(steps2, array_size, compare_mode)
            
            response['steps2'] = filtered_steps2
            response['total_comparisons2'] = visualizer2.comparisons
            response['total_swaps2'] = visualizer2.swaps
            response['algorithm2'] = algorithm2
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/generate', methods=['POST'])
def generate_array():
    """API endpoint to generate a random array."""
    try:
        data = request.json
        size = data.get('size', 15)
        max_val = data.get('max_val', 100)
        
        if size < 1 or size > 1000:
            return jsonify({'error': 'Size must be between 1-1000'}), 400
        
        import random
        array = [random.randint(1, max_val) for _ in range(size)]
        
        return jsonify({
            'success': True,
            'array': array
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    print("🍹 Cocktail Sort Visualizer")
    print("=" * 60)
    print("Starting server...")
    print("Open your browser and navigate to: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000, host='0.0.0.0')
