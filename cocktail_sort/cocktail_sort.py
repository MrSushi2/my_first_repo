"""
Cocktail Sort (Cocktail Shaker Sort) Implementation with Visualization
A sorting algorithm that sorts in both directions on each pass through the list.
"""

def cocktail_sort(arr, visualize=False):
    """
    Perform cocktail sort on the array.
    
    Args:
        arr: List to be sorted
        visualize: If True, prints each step of the sorting process
    
    Returns:
        Tuple of (sorted_array, number_of_swaps)
    """
    n = len(arr)
    swaps = 0
    start = 0
    end = n - 1
    
    if visualize:
        print(f"Starting Cocktail Sort on array: {arr}")
        print("-" * 60)
    
    while start < end:
        # Forward pass (left to right)
        if visualize:
            print(f"\n📍 Forward Pass: comparing indices {start} to {end-1}")
        
        for i in range(start, end):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swaps += 1
                if visualize:
                    print(f"  Swap: {arr[i+1]} <-> {arr[i]} → {arr}")
        
        end -= 1
        
        if visualize:
            print(f"After forward pass: {arr}")
        
        # Backward pass (right to left)
        if start < end:
            if visualize:
                print(f"\n📍 Backward Pass: comparing indices {end} down to {start+1}")
            
            for i in range(end, start, -1):
                if arr[i - 1] > arr[i]:
                    arr[i - 1], arr[i] = arr[i], arr[i - 1]
                    swaps += 1
                    if visualize:
                        print(f"  Swap: {arr[i]} <-> {arr[i-1]} → {arr}")
            
            if visualize:
                print(f"After backward pass: {arr}")
            
            start += 1
    
    if visualize:
        print("-" * 60)
        print(f"✅ Sorting complete!")
        print(f"Final sorted array: {arr}")
        print(f"Total swaps: {swaps}")
    
    return arr, swaps


def visualize_bars(arr, title="Array State"):
    """
    Create a simple text-based visualization of the array as bars.
    
    Args:
        arr: List to visualize
        title: Title for the visualization
    """
    print(f"\n{title}")
    max_val = max(arr) if arr else 1
    
    for i, val in enumerate(arr):
        bar_length = int((val / max_val) * 40)
        bar = "█" * bar_length
        print(f"[{i:2d}] {val:3d} | {bar}")


def compare_sorting_algorithms(arr):
    """
    Compare cocktail sort with Python's built-in sort.
    """
    import copy
    
    print("\n" + "="*60)
    print("COCKTAIL SORT vs BUILT-IN SORT COMPARISON")
    print("="*60)
    
    arr_copy = copy.deepcopy(arr)
    print(f"\nOriginal array: {arr}")
    
    # Cocktail sort
    print("\n" + "-"*60)
    print("COCKTAIL SORT:")
    print("-"*60)
    sorted_cocktail, swaps = cocktail_sort(arr_copy.copy(), visualize=False)
    print(f"Sorted: {sorted_cocktail}")
    print(f"Swaps performed: {swaps}")
    
    # Built-in sort
    print("\n" + "-"*60)
    print("PYTHON BUILT-IN SORT:")
    print("-"*60)
    sorted_builtin = sorted(arr)
    print(f"Sorted: {sorted_builtin}")
    
    print("\n" + "="*60)
    print(f"Results match: {sorted_cocktail == sorted_builtin}")
    print("="*60)


if __name__ == "__main__":
    # Example 1: Simple array
    print("\n🎯 EXAMPLE 1: Simple Array")
    print("="*60)
    arr1 = [5, 3, 8, 4, 2, 7, 1, 6]
    cocktail_sort(arr1.copy(), visualize=True)
    
    # Example 2: Already sorted array
    print("\n\n🎯 EXAMPLE 2: Already Sorted Array")
    print("="*60)
    arr2 = [1, 2, 3, 4, 5]
    result, swaps = cocktail_sort(arr2.copy(), visualize=False)
    print(f"Input: {arr2}")
    print(f"Output: {result}")
    print(f"Swaps: {swaps}")
    
    # Example 3: Reverse sorted array
    print("\n\n🎯 EXAMPLE 3: Reverse Sorted Array")
    print("="*60)
    arr3 = [5, 4, 3, 2, 1]
    result, swaps = cocktail_sort(arr3.copy(), visualize=False)
    print(f"Input: {arr3}")
    print(f"Output: {result}")
    print(f"Swaps: {swaps}")
    
    # Example 4: Array with duplicates
    print("\n\n🎯 EXAMPLE 4: Array with Duplicates")
    print("="*60)
    arr4 = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]
    result, swaps = cocktail_sort(arr4.copy(), visualize=False)
    print(f"Input: {arr4}")
    print(f"Output: {result}")
    print(f"Swaps: {swaps}")
    
    # Example 5: Comparison
    print("\n\n🎯 EXAMPLE 5: Algorithm Comparison")
    print("="*60)
    arr5 = [64, 34, 25, 12, 22, 11, 90]
    compare_sorting_algorithms(arr5)
