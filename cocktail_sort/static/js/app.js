/**
 * Multi-Algorithm Sort Visualizer - Frontend Application
 * Supports Cocktail, Bubble, and Insertion sort with optional comparison mode
 */

// Application state
let state = {
    currentArray: null,
    selectedAlgorithm: 'cocktail',
    selectedAlgorithm2: 'bubble',
    compareMode: false,
    isAnimating: false,
    
    steps1: [],
    steps2: [],
    currentStep1: 0,
    currentStep2: 0,
    animationCancelled: false
};

// Algorithm display names
const ALGORITHM_NAMES = {
    cocktail: 'Cocktail Sort',
    bubble: 'Bubble Sort',
    insertion: 'Insertion Sort',
    selection: 'Selection Sort',
    quick: 'Quick Sort'
};

/**
 * Generate sequential array based on size input (1, 2, 3, ..., n)
 */
function generateRandom() {
    const size = parseInt(document.getElementById('arraySize').value) || 15;
    if (size < 1 || size > 1000) {
        alert('Array size must be between 1 and 1000');
        return;
    }
    
    // Create sequential array: [1, 2, 3, ..., size]
    state.currentArray = Array.from({ length: size }, (_, i) => i + 1);
    renderInitial();
}

/**
 * Calculate dynamic bar sizing based on array length
 */
function getBarDimensions(arrayLength) {
    let gap, maxBarHeight;
    
    if (arrayLength <= 50) {
        gap = 2.0;
        maxBarHeight = 250;
    } else if (arrayLength <= 100) {
        gap = 1.5;
        maxBarHeight = 200;
    } else if (arrayLength <= 200) {
        gap = 1.0;
        maxBarHeight = 150;
    } else if (arrayLength <= 500) {
        gap = 0.75;
        maxBarHeight = 120;
    } else {
        gap = 0.5;
        maxBarHeight = 100;
    }
    
    return { gap, maxBarHeight };
}

/**
 * Render initial array state (sorted)
 */
function renderInitial() {
    if (!state.currentArray) {
        state.currentArray = Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1);
    }
    
    // Sort the initial array for display
    const sortedArray = [...state.currentArray].sort((a, b) => a - b);
    
    const initialStep = {
        array: sortedArray,
        comparing: [],
        swapped: [],
        sorted: Array.from({ length: sortedArray.length }, (_, i) => i),
        comparisons: 0,
        swaps: 0,
        type: 'initial'
    };
    
    renderBars(initialStep, 1);
    if (state.compareMode) {
        renderBars(initialStep, 2);
    }
    
    updateStats(initialStep, null);
}

/**
 * Render bars for a specific container
 */
function renderBars(step, containerNum) {
    const containerId = containerNum === 1 ? 'barsContainer1' : 'barsContainer2';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const array = step.array;
    const arrayLength = array.length;
    const { gap, maxBarHeight } = getBarDimensions(arrayLength);
    const maxVal = Math.max(...array, 1);
    const comparing = new Set(step.comparing || []);
    const swapped = new Set(step.swapped || []);
    const sorted = new Set(step.sorted || []);

    // Set container gap dynamically
    container.style.gap = gap + 'px';

    array.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = (val / maxVal * maxBarHeight) + 'px';

        if (sorted.has(idx)) {
            bar.classList.add('sorted');
        } else if (swapped.has(idx)) {
            bar.classList.add('swapped');
        } else if (comparing.has(idx)) {
            bar.classList.add('comparing');
        }

        container.appendChild(bar);
    });
}

/**
 * Update statistics display
 */
function updateStats(step1, step2) {
    // Container 1 stats
    const comp1El = document.getElementById('comp1');
    const swap1El = document.getElementById('swap1');
    if (comp1El && step1) {
        comp1El.textContent = step1.comparisons || 0;
    }
    if (swap1El && step1) {
        swap1El.textContent = step1.swaps || 0;
    }
    
    // Container 2 stats (if in compare mode)
    if (state.compareMode && step2) {
        const comp2El = document.getElementById('comp2');
        const swap2El = document.getElementById('swap2');
        if (comp2El) {
            comp2El.textContent = step2.comparisons || 0;
        }
        if (swap2El) {
            swap2El.textContent = step2.swaps || 0;
        }
    }
}

/**
 * Generate scramble steps - quick random shuffles to show unsorted state
 * More scrambles for larger arrays (but reasonable amount)
 */
function generateScrambleSteps(array) {
    const scrambleSteps = [];
    // Start from the sorted version
    let shuffled = [...array].sort((a, b) => a - b);
    
    // Reduce scrambles based on array size (significantly less than before)
    let numScrambles;
    if (array.length <= 20) {
        numScrambles = array.length;  // 20 for size 20
    } else if (array.length <= 50) {
        numScrambles = Math.floor(array.length * 1.5);  // 75 for size 50
    } else if (array.length <= 100) {
        numScrambles = Math.floor(array.length * 2);  // 200 for size 100
    } else {
        numScrambles = Math.floor(array.length * 2);  // 200+ for larger
    }
    
    for (let i = 0; i < numScrambles; i++) {
        // Fisher-Yates shuffle (one iteration)
        const j = Math.floor(Math.random() * shuffled.length);
        const k = Math.floor(Math.random() * shuffled.length);
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
        
        scrambleSteps.push({
            array: [...shuffled],
            comparing: [j, k],
            swapped: [],
            sorted: [],
            comparisons: 0,
            swaps: i + 1,
            type: 'scramble'
        });
    }
    
    return scrambleSteps;
}

/**
 * Animate scrambling before sort
 */
async function animateScrambling(scrambleSteps, containerNum) {
    const speed = parseInt(document.getElementById('speed').value);
    // Scramble animation is faster - about 30% of sort speed
    const waitTime = Math.max(3, Math.max(5, 95 - (speed - 1) * 0.9) * 0.3);
    
    for (let i = 0; i < scrambleSteps.length; i++) {
        if (!state.isAnimating || state.animationCancelled) break;
        
        const step = scrambleSteps[i];
        renderBars(step, containerNum);
        updateStats(step, null);
        
        await sleep(waitTime);
    }
}

/**
 * Sleep function for animation timing
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Animate through sorting steps
 */
async function animateSorting() {
    const maxSteps = Math.max(state.steps1.length, state.steps2.length || 0);
    
    for (let i = 0; i < maxSteps; i++) {
        if (!state.isAnimating || state.animationCancelled) break;
        
        // Read speed value in real-time (allows changes during animation)
        // Speed 1-100: 1 is slowest (90ms), 100 is fastest (5ms)
        const speed = parseInt(document.getElementById('speed').value);
        const waitTime = Math.max(5, 95 - (speed - 1) * 0.9);
        
        // Render container 1
        if (i < state.steps1.length) {
            state.currentStep1 = i;
            const step = state.steps1[i];
            renderBars(step, 1);
            updateStats(step, null);
        }
        
        // Render container 2 (if compare mode)
        if (state.compareMode && i < state.steps2.length) {
            state.currentStep2 = i;
            const step = state.steps2[i];
            renderBars(step, 2);
            updateStats(state.steps1[i] || null, step);
        }
        
        // Dynamic wait based on speed slider
        await sleep(waitTime);
    }
}

/**
 * Update control states
 */
function updateControlStates(isRunning) {
    const algorithmSelect = document.getElementById('algorithmSelect');
    const algorithm2Select = document.getElementById('algorithm2Select');
    const compareCheckbox = document.getElementById('compareMode');
    const arraySizeInput = document.getElementById('arraySize');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (isRunning) {
        algorithmSelect.disabled = true;
        if (algorithm2Select) algorithm2Select.disabled = true;
        compareCheckbox.disabled = true;
        arraySizeInput.disabled = true;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
    } else {
        algorithmSelect.disabled = false;
        if (algorithm2Select) algorithm2Select.disabled = false;
        compareCheckbox.disabled = false;
        arraySizeInput.disabled = false;
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
    }
}

/**
 * Stop current animation
 */
function stopSort() {
    state.animationCancelled = true;
    state.isAnimating = false;
    updateControlStates(false);
}

/**
 * Start sorting animation
 */
async function startSort() {
    if (!state.currentArray || state.currentArray.length === 0) {
        generateRandom();
    }

    if (state.isAnimating) {
        return; // Already animating
    }

    state.isAnimating = true;
    state.animationCancelled = false;
    updateControlStates(true);
    
    try {
        // Generate scramble steps first (starting from sorted array)
        const scrambleSteps = generateScrambleSteps(state.currentArray);
        
        // Animate scrambling in container 1
        await animateScrambling(scrambleSteps, 1);
        
        // After scrambling, update currentArray to the final scrambled state
        if (scrambleSteps.length > 0) {
            state.currentArray = scrambleSteps[scrambleSteps.length - 1].array.slice();
        }
        
        // Animate scrambling in container 2 (if compare mode)
        if (state.compareMode) {
            await animateScrambling(scrambleSteps, 2);
        }
        
        if (!state.isAnimating || state.animationCancelled) {
            state.isAnimating = false;
            updateControlStates(false);
            return;
        }
        
        const payload = {
            array: state.currentArray,
            algorithm: state.selectedAlgorithm,
            compare: state.compareMode,
            algorithm2: state.compareMode ? state.selectedAlgorithm2 : null
        };

        const response = await fetch('/api/sort', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to fetch sorting data');
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Sorting failed');
        }

        state.steps1 = data.steps || [];
        state.steps2 = state.compareMode && data.steps2 ? data.steps2 : [];
        state.currentStep1 = 0;
        state.currentStep2 = 0;

        // Animate the sorting
        await animateSorting();

        state.isAnimating = false;
        updateControlStates(false);

    } catch (error) {
        console.error('Error:', error);
        alert('Sorting failed: ' + error.message);
        state.isAnimating = false;
        updateControlStates(false);
    }
}

/**
 * Update algorithm 2 dropdown visibility and update names
 */
function updateCompareMode() {
    const compareCheckbox = document.getElementById('compareMode');
    const algorithm2Item = document.getElementById('algorithm2Item');
    const container2 = document.getElementById('container2');
    
    state.compareMode = compareCheckbox.checked;
    
    if (algorithm2Item) {
        algorithm2Item.style.display = state.compareMode ? 'flex' : 'none';
    }
    if (container2) {
        container2.style.display = state.compareMode ? 'flex' : 'none';
    }
    
    updateAlgorithmNames();
    renderInitial();
}

/**
 * Update displayed algorithm names
 */
function updateAlgorithmNames() {
    const algo1Name = document.getElementById('algo1Name');
    const algo2Name = document.getElementById('algo2Name');
    
    if (algo1Name) {
        algo1Name.textContent = ALGORITHM_NAMES[state.selectedAlgorithm] || 'Unknown Algorithm';
    }
    if (algo2Name && state.compareMode) {
        algo2Name.textContent = ALGORITHM_NAMES[state.selectedAlgorithm2] || 'Unknown Algorithm';
    }
}

/**
 * Handle algorithm selection change
 */
function handleAlgorithmChange(e) {
    state.selectedAlgorithm = e.target.value;
    updateAlgorithmNames();
}

/**
 * Handle second algorithm selection change
 */
function handleAlgorithm2Change(e) {
    state.selectedAlgorithm2 = e.target.value;
    updateAlgorithmNames();
}

/**
 * Handle speed slider change
 */
function updateSpeed() {
    const speed = document.getElementById('speed').value;
    const speedValue = document.getElementById('speedValue');
    if (speedValue) {
        speedValue.textContent = speed;
    }
}

/**
 * Handle array size change - stop animation and load new array
 */
function handleArraySizeChange() {
    // Stop any ongoing animation
    if (state.isAnimating) {
        state.animationCancelled = true;
        state.isAnimating = false;
    }
    
    // Clear old rendering from both containers
    const container1 = document.getElementById('barsContainer1');
    const container2 = document.getElementById('barsContainer2');
    if (container1) {
        container1.innerHTML = '';
    }
    if (container2) {
        container2.innerHTML = '';
    }
    
    // Reset animation state
    state.steps1 = [];
    state.steps2 = [];
    state.currentStep1 = 0;
    state.currentStep2 = 0;
    state.animationCancelled = false;
    
    // Generate new array and render
    generateRandom();
    
    // Reset controls
    updateControlStates(false);
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize state
    generateRandom();
    updateAlgorithmNames();
    
    // Setup event listeners
    const algorithmSelect = document.getElementById('algorithmSelect');
    const algorithm2Select = document.getElementById('algorithm2Select');
    const compareCheckbox = document.getElementById('compareMode');
    const speedSlider = document.getElementById('speed');
    const arraySizeInput = document.getElementById('arraySize');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (algorithmSelect) {
        algorithmSelect.addEventListener('change', handleAlgorithmChange);
    }
    if (algorithm2Select) {
        algorithm2Select.addEventListener('change', handleAlgorithm2Change);
    }
    if (compareCheckbox) {
        compareCheckbox.addEventListener('change', updateCompareMode);
    }
    if (speedSlider) {
        speedSlider.addEventListener('input', updateSpeed);
        updateSpeed(); // Set initial speed display
    }
    if (arraySizeInput) {
        arraySizeInput.addEventListener('change', handleArraySizeChange);
    }
    if (startBtn) {
        startBtn.addEventListener('click', startSort);
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', stopSort);
    }
});
