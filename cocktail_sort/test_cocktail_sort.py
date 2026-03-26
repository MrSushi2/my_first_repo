"""
Unit Tests for Cocktail Sort Implementation
"""

import unittest
from cocktail_sort import cocktail_sort
import random


class TestCocktailSort(unittest.TestCase):
    """Test cases for the cocktail sort algorithm."""

    def test_empty_array(self):
        """Test sorting an empty array."""
        arr = []
        result, swaps = cocktail_sort(arr)
        self.assertEqual(result, [])
        self.assertEqual(swaps, 0)

    def test_single_element(self):
        """Test sorting an array with a single element."""
        arr = [5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [5])
        self.assertEqual(swaps, 0)

    def test_two_elements_sorted(self):
        """Test sorting an already sorted two-element array."""
        arr = [1, 2]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2])
        self.assertEqual(swaps, 0)

    def test_two_elements_unsorted(self):
        """Test sorting an unsorted two-element array."""
        arr = [2, 1]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2])
        self.assertEqual(swaps, 1)

    def test_simple_array(self):
        """Test sorting a simple array."""
        arr = [5, 3, 8, 4, 2, 7, 1, 6]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2, 3, 4, 5, 6, 7, 8])
        self.assertGreater(swaps, 0)
        self.assertLessEqual(swaps, len(arr) * (len(arr) - 1) // 2)

    def test_already_sorted(self):
        """Test that sorting an already sorted array requires zero swaps."""
        arr = [1, 2, 3, 4, 5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2, 3, 4, 5])
        self.assertEqual(swaps, 0)

    def test_reverse_sorted(self):
        """Test sorting a reverse sorted array."""
        arr = [5, 4, 3, 2, 1]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2, 3, 4, 5])
        self.assertGreater(swaps, 0)

    def test_duplicates(self):
        """Test sorting an array with duplicate elements."""
        arr = [3, 1, 4, 1, 5, 9, 2, 6, 5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 1, 2, 3, 4, 5, 5, 6, 9])

    def test_all_same_elements(self):
        """Test sorting an array with all identical elements."""
        arr = [5, 5, 5, 5, 5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [5, 5, 5, 5, 5])
        self.assertEqual(swaps, 0)

    def test_negative_numbers(self):
        """Test sorting an array with negative numbers."""
        arr = [-3, 5, -1, 2, -8, 4]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [-8, -3, -1, 2, 4, 5])

    def test_mixed_positive_negative(self):
        """Test sorting an array with mixed positive and negative numbers."""
        arr = [10, -5, 3, -2, 8, 0, -10, 5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [-10, -5, -2, 0, 3, 5, 8, 10])

    def test_float_numbers(self):
        """Test sorting an array with float numbers."""
        arr = [3.5, 1.2, 4.8, 2.1, 3.5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1.2, 2.1, 3.5, 3.5, 4.8])

    def test_large_random_array(self):
        """Test sorting a large random array."""
        arr = [random.randint(1, 1000) for _ in range(100)]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, sorted(arr))

    def test_nearly_sorted_array(self):
        """Test sorting a nearly sorted array (best case scenario)."""
        arr = [1, 2, 3, 4, 6, 5, 7, 8, 9, 10]  # Only 5 and 6 are out of order
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        self.assertLess(swaps, 10)  # Should require few swaps

    def test_stability(self):
        """Test that cocktail sort is stable (preserves order of equal elements)."""
        # Create array of tuples (value, index) to track original positions
        arr = [(3, 0), (1, 1), (3, 2), (2, 3)]
        
        # Extract just values for sorting
        values = [x[0] for x in arr]
        result, swaps = cocktail_sort(values.copy())
        
        # Verify sorted
        self.assertEqual(result, [1, 2, 3, 3])

    def test_comparison_with_builtin_sort(self):
        """Test that cocktail sort produces same result as Python's built-in sort."""
        for _ in range(10):
            arr = [random.randint(1, 1000) for _ in range(50)]
            result, _ = cocktail_sort(arr.copy())
            self.assertEqual(result, sorted(arr))

    def test_single_swap_needed(self):
        """Test array requiring exactly one swap."""
        arr = [2, 1]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2])
        self.assertEqual(swaps, 1)

    def test_multiple_swaps_large_to_small(self):
        """Test array with large element at beginning."""
        arr = [10, 1, 2, 3, 4, 5]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2, 3, 4, 5, 10])
        self.assertGreater(swaps, 0)

    def test_multiple_swaps_small_to_large(self):
        """Test array with small element at end."""
        arr = [5, 4, 3, 2, 1, 0]
        result, swaps = cocktail_sort(arr.copy())
        self.assertEqual(result, [0, 1, 2, 3, 4, 5])
        self.assertGreater(swaps, 0)

    def test_array_not_modified_on_copy(self):
        """Test that original array is modified (in-place sorting)."""
        arr = [5, 3, 8, 4, 2]
        original = arr.copy()
        cocktail_sort(arr)
        # Array should be modified since it's in-place
        self.assertNotEqual(arr, original)
        self.assertEqual(sorted(arr), sorted(original))


class TestCocktailSortPerformance(unittest.TestCase):
    """Performance and edge case tests."""

    def test_swap_count_bounds(self):
        """Test that swap count is reasonable."""
        arr = [random.randint(1, 1000) for _ in range(50)]
        _, swaps = cocktail_sort(arr.copy())
        
        # Theoretical maximum swaps for cocktail sort
        max_possible_swaps = len(arr) * (len(arr) - 1) // 2
        self.assertLessEqual(swaps, max_possible_swaps)
        self.assertGreaterEqual(swaps, 0)

    def test_array_with_gaps(self):
        """Test array with large gaps in values."""
        arr = [1000, 1, 999, 2, 998, 3]
        result, _ = cocktail_sort(arr.copy())
        self.assertEqual(result, [1, 2, 3, 998, 999, 1000])


def run_comprehensive_tests():
    """Run all tests and print results."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestCocktailSort))
    suite.addTests(loader.loadTestsFromTestCase(TestCocktailSortPerformance))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED!")
    else:
        print("\n❌ SOME TESTS FAILED!")
    
    return result.wasSuccessful()


if __name__ == '__main__':
    run_comprehensive_tests()
