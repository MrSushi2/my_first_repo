"""
Interactive Cocktail Sort Testing Tool
Allows users to test the algorithm with custom inputs
"""

from cocktail_sort import cocktail_sort, visualize_bars
import random
import time


def get_user_array():
    """Get array input from user."""
    print("\n" + "="*60)
    print("CREATE CUSTOM ARRAY")
    print("="*60)
    print("\nChoose input method:")
    print("1. Enter numbers manually (comma or space separated)")
    print("2. Generate random array")
    print("3. Use predefined test case")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == "1":
        try:
            user_input = input("Enter numbers (e.g., 5 3 8 4 2): ").strip()
            # Try both comma and space separated
            if ',' in user_input:
                arr = [int(x.strip()) for x in user_input.split(',')]
            else:
                arr = [int(x.strip()) for x in user_input.split()]
            return arr
        except ValueError:
            print("❌ Invalid input! Using default array instead.")
            return [5, 3, 8, 4, 2, 7, 1, 6]
    
    elif choice == "2":
        try:
            size = int(input("Array size (1-100): ").strip())
            max_val = int(input("Maximum value (1-1000): ").strip())
            arr = [random.randint(1, max_val) for _ in range(max(1, min(size, 100)))]
            print(f"Generated array: {arr}")
            return arr
        except ValueError:
            print("❌ Invalid input! Using default array instead.")
            return [5, 3, 8, 4, 2, 7, 1, 6]
    
    elif choice == "3":
        print("\nTest cases:")
        print("1. Small random")
        print("2. Already sorted")
        print("3. Reverse sorted")
        print("4. All same elements")
        print("5. Large with duplicates")
        
        test_choice = input("Select test (1-5): ").strip()
        
        test_cases = {
            "1": [9, 3, 7, 1, 8, 2, 5],
            "2": [1, 2, 3, 4, 5, 6, 7],
            "3": [9, 8, 7, 6, 5, 4, 3, 2, 1],
            "4": [5, 5, 5, 5, 5],
            "5": [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9]
        }
        
        return test_cases.get(test_choice, [5, 3, 8, 4, 2, 7, 1, 6])
    
    else:
        print("❌ Invalid choice! Using default array.")
        return [5, 3, 8, 4, 2, 7, 1, 6]


def analyze_performance(arr):
    """Analyze performance metrics of sorting."""
    import copy
    
    print("\n" + "="*60)
    print("PERFORMANCE ANALYSIS")
    print("="*60)
    
    arr_copy = copy.deepcopy(arr)
    
    print(f"Array size: {len(arr)}")
    print(f"Array: {arr}")
    
    # Time the sorting
    start_time = time.time()
    sorted_arr, swaps = cocktail_sort(arr_copy.copy(), visualize=False)
    end_time = time.time()
    
    elapsed_time = (end_time - start_time) * 1000  # Convert to milliseconds
    
    print(f"\n✅ Sorting Results:")
    print(f"   Sorted array: {sorted_arr}")
    print(f"   Total swaps: {swaps}")
    print(f"   Time taken: {elapsed_time:.4f} ms")
    
    # Calculate statistics
    comparisons = len(arr) * (len(arr) - 1) // 2  # Worst case
    print(f"\n📊 Statistics:")
    print(f"   Theoretical max comparisons: {comparisons}")
    print(f"   Actual swaps: {swaps}")
    print(f"   Efficiency: {(swaps/comparisons*100) if comparisons > 0 else 0:.2f}%")


def visualize_sorting_steps(arr):
    """Show step-by-step visualization."""
    print("\n" + "="*60)
    print("STEP-BY-STEP VISUALIZATION")
    print("="*60)
    
    arr_copy = arr.copy()
    print(f"\nStarting array: {arr_copy}")
    visualize_bars(arr_copy, "Initial state:")
    
    input("\nPress Enter to start detailed sorting visualization...")
    cocktail_sort(arr_copy, visualize=True)


def compare_with_tests():
    """Run predetermined test cases."""
    test_cases = {
        "Small Array": [5, 3, 8, 4, 2],
        "Medium Array": [64, 34, 25, 12, 22, 11, 90, 88],
        "Large Array": [42, 17, 93, 8, 54, 27, 61, 9, 35, 72, 15, 81, 46, 29, 3],
    }
    
    print("\n" + "="*60)
    print("BATCH TEST RESULTS")
    print("="*60)
    
    for name, arr in test_cases.items():
        sorted_arr, swaps = cocktail_sort(arr.copy(), visualize=False)
        print(f"\n{name}:")
        print(f"  Input:  {arr}")
        print(f"  Output: {sorted_arr}")
        print(f"  Swaps:  {swaps}")


def main():
    """Main interactive menu."""
    print("\n" + "🍹"*20)
    print(" "*10 + "COCKTAIL SORT SIMULATOR")
    print("🍹"*20)
    
    while True:
        print("\n" + "="*60)
        print("MAIN MENU")
        print("="*60)
        print("1. Test with custom array")
        print("2. Visualize sorting steps")
        print("3. Run performance analysis")
        print("4. Run batch tests")
        print("5. Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == "1":
            arr = get_user_array()
            sorted_arr, swaps = cocktail_sort(arr.copy(), visualize=False)
            print(f"\n✅ Result: {sorted_arr}")
            print(f"📊 Swaps: {swaps}")
        
        elif choice == "2":
            arr = get_user_array()
            visualize_sorting_steps(arr)
        
        elif choice == "3":
            arr = get_user_array()
            analyze_performance(arr)
        
        elif choice == "4":
            compare_with_tests()
        
        elif choice == "5":
            print("\n👋 Goodbye! Thanks for using Cocktail Sort Simulator!")
            break
        
        else:
            print("❌ Invalid choice! Please try again.")


if __name__ == "__main__":
    main()
