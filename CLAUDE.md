# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MLTutor** is a machine learning visualization education platform (机器学习可视化教学平台), inspired by 李宏毅's ML course and built using Anthropic's "Effective harnesses for long-running agents" pattern.

**Inspired by**: 李宏毅 2024 机器学习课程 (https://www.bilibili.com/video/BV1PZ421y7Fe/)

- **Tech Stack**: Pure HTML/CSS/JavaScript (no build step required)
- **CDN Dependencies**: D3.js (index.html + algorithm pages), Plotly.js (algorithm pages only), KaTeX (all pages)
- **Development**: Open HTML files directly in browser, or use simple HTTP server

## Important Development Notes

- **No build process**: Files can be edited and changes seen immediately by refreshing the browser
- **CDN libraries**: D3.js v7, Plotly.js v2.26.0, KaTeX v0.16.9 - ensure version compatibility when updating
- **Bash scripts**: The harness system uses Bash - on Windows, use Git Bash or WSL to run session_start.sh
- **File encoding**: Use UTF-8 encoding for all files (Chinese characters present)
- **Windows users**: Always use `/` as path separator (not `\`), even on Windows. Git Bash handles this automatically.

## Running the Project

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js serve
npx serve

# Option 3: Just open index.html directly (works for most features)
```

Then navigate to `http://localhost:8000` (or respective port).

## Architecture

```
MLTutor/
├── index.html                          # Landing page with D3.js knowledge graph
├── algorithms/
│   ├── template.html                  # Template for new algorithm pages
│   ├── linear-regression/index.html
│   ├── logistic-regression/index.html
│   ├── svm/index.html
│   ├── knn/index.html
│   ├── nn/index.html
│   └── [algorithm]/notebook.ipynb   # Jupyter notebook for each algorithm
├── assets/
│   ├── css/
│   │   ├── style.css               # Global styles + CSS variables (theming)
│   │   └── algorithm.css           # Algorithm page layout styles
│   └── js/
│       ├── knowledge-graph.js       # D3.js tree visualization + level colors
│       ├── [algorithm].js          # Algorithm-specific visualization code
└── .claude/harness/                   # Long-running agent harness system
    ├── feature_list.json              # Task tracking (anthropic pattern)
    ├── claude-progress.txt            # Session progress log
    ├── init.sh                       # Environment setup script
    └── session_start.sh              # Run this to start each session
```

## Knowledge Graph Navigation

The main page (`index.html`) features a D3.js tree visualization in `assets/js/knowledge-graph.js`:

**Important Architecture Note**: This visualization does NOT use D3's built-in tree layout (`d3.tree()`). Instead:
- `buildHierarchy()` manually calculates node positions using a custom algorithm
- Nodes are arranged by depth (y-axis) and evenly spaced within each level (x-axis)
- This custom approach was chosen for predictable, symmetric layout
- `knowledgeData` object contains the full ML algorithm hierarchy
- Nodes are colored by `visualLevel` (1-5) indicating visualization complexity
- Category-level coloring uses `categoryColors` object (depth-based)
- Clickable nodes link to `algorithms/[name]/index.html`
- Responsive: automatically re-renders on window resize (300ms debounce)

**When adding new algorithms**, update `knowledgeData` with proper structure:
- Add node with `name`, `nameEn`, `level`, `url`, and `visualLevel` properties
- Ensure parent category nodes exist (supervised/unsupervised/reinforcement learning)

## Main Page Card Layout

The homepage (`index.html`) uses a **2-column flex card layout**:
- `.card-grid` uses `display: flex` with `flex-wrap: wrap`
- Each card has `width: calc(50% - 10px)` for 2-column layout
- Cards automatically stack to single column on mobile (max-width: 768px)

**Warning**: There is currently a duplicate KNN card (appears twice) - remove the duplicate if editing.

## Algorithm Page Template

When adding a new algorithm:
1. Copy `algorithms/template.html` to `algorithms/[name]/index.html`
2. Replace placeholders: `{{ALGORITHM_NAME}}`, `{{ALGORITHM_ID}}`, `{{ALGORITHM_INTRO}}`, etc.
3. Create corresponding `assets/js/[name].js` with D3.js/Plotly.js visualization
4. Update `knowledgeData` in `knowledge-graph.js` to add the new node
5. Add `notebook.ipynb` if applicable

**Template placeholders** (must be replaced):
- `{{ALGORITHM_NAME}}`: Display name (e.g., "线性回归")
- `{{ALGORITHM_ID}}`: JS filename without .js extension (e.g., "linear-regression")
- `{{ALGORITHM_INTRO}}`: HTML content for intro section
- `{{CONTROLS_HTML}}`: HTML for interactive controls (sliders, selects, etc.)
- `{{MATH_CONTENT}}`: KaTeX math explanation
- `{{NOTEBOOK_FEATURES}}`: List items (<li>) for notebook features
- `{{RELATED_ALGORITHMS}}`: List items for related algorithms links
- `{{VISUAL_LEVEL}}`: Number 1-5 for visualization level
- `{{LEVEL_DESCRIPTION}}`: Text explanation of the level meaning

**Note**: The template includes KaTeX CDN links and automatic rendering. Use KaTeX syntax like `$$x^2$$` for display math and `$x$` for inline math.

## Algorithm JavaScript File Pattern

Each algorithm's visualization file (`assets/js/[algorithm].js`) follows this general structure:

```javascript
// Global state variables
let param1, param2, data = [];

// D3 selection
const vizContainer = d3.select('#visualization');
let svg, g, xScale, yScale;

// Initialize visualization (called on page load)
function initVisualization() {
    // Clear container, create SVG, set up scales/axes
    // Bind event listeners to controls
}

// Core rendering function (called when parameters change)
function renderVisualization() {
    // Update visual elements based on current state
    // D3 data joins for efficient updates
}

// Helper functions
function generateData() { /* ... */ }
function updateMetrics() { /* ... */ }

// Event listeners for controls
document.getElementById('some-slider').addEventListener('input', (e) => {
    param1 = parseFloat(e.target.value);
    renderVisualization();
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initVisualization);
```

**Key patterns**:
- Use `d3.select('#visualization')` to target the container
- Store scales (`xScale`, `yScale`) globally for reuse in render
- Separate `initVisualization()` (setup) from `renderVisualization()` (updates)
- Use D3 data joins (`data().enter().append().merge()`) for efficient updates

## Visualization Libraries

The project uses two complementary libraries:

| Library | Use Case | When to Use |
|---------|----------|-------------|
| **D3.js v7** | Custom SVG-based visualizations | Most algorithm pages, decision boundaries, network diagrams |
| **Plotly.js v2.26.0** | Interactive charts with built-in interactivity | 3D plots, complex heatmaps, when zoom/pan is needed |

**Rule of thumb**: Use D3.js for custom algorithm visualizations where you need full control. Use Plotly.js for standard chart types or when you need built-in features like zoom, pan, hover tooltips.

## KaTeX Math Rendering

Both `index.html` and `template.html` include inline KaTeX rendering code that automatically processes math content.

**Usage in content:**
- **Display math**: Wrap in `$$...$$` or use a `<div class="math-content">` / `<div class="katex-display">`
- **Inline math**: Wrap in `$...$` within text paragraphs

**Example**:
```html
<div class="math-content">
    <p>Display formula: $$y = mx + b$$</p>
    <p>Inline: The cost function $J(\theta)$ is...</p>
</div>
```

**Important**: The rendering happens on `window.load` - ensure KaTeX CDN is loaded before the rendering script executes.

## Visualization Level System

Colors defined in both `style.css` and `knowledge-graph.js`:

| Level | Color | Meaning |
|-------|-------|---------|
| 1 | Green (`#10b981`) | Basic intuition building (直观可建) |
| 2 | Blue (`#3b82f6`) | Structural understanding (结构理解) |
| 3 | Orange (`#f59e0b`) | Interactive exploration (交互式理解) |
| 4 | Red (`#ef4444`) | Deep learning (深度学习) |
| 5 | Purple (`#8b5cf6`) | Conceptual abstraction (概念隐喻) |

## Session Start Workflow

**At the beginning of each session**, run:
```bash
bash .claude/harness/session_start.sh
```

This will display:
- Current directory and project structure
- Task progress summary (from `feature_list.json`)
- Progress log (from `claude-progress.txt`)
- Git history and status
- Environment initialization

## CSS Variables (Theming)

Global theme defined in `assets/css/style.css` `:root`:
- `--primary-color`, `--secondary-color`, `--accent-color`
- `--level-*-color` for visualization levels
- `--bg-color`, `--card-bg`, `--text-color`, `--border-color`

Use these for consistency when adding new styles.

## Jupyter Notebooks

Each algorithm folder may contain `notebook.ipynb` with:
- Interactive code cells matching the visualization
- Links to open in Google Colab
- Feature list displayed in algorithm page sidebar

## Key Algorithms Completed

- **Linear Regression** (Level 1): Interactive slope/intercept/noise/samples
- **Logistic Regression** (Level 1): Decision boundary with sigmoid visualization
- **SVM** (Level 3): C parameter, kernel functions (Linear/RBF/Poly), gamma, decision boundary
- **KNN** (Level 1): K value (1-15), distance metrics, multiple datasets, test point mode
- **Neural Networks** (Level 4): Hidden layers (1-4), neurons (2-8), activation functions, layer-wise activation visualization

## Harness System Files

The `.claude/harness/` directory implements the long-running agent pattern:

- **feature_list.json**: Task tracking with categories (foundation/automation/mltutor/git). Each task has id, category, description, status, and steps array.
- **claude-progress.txt**: Session progress log format - session number, timestamp, completed tasks, issues encountered, next steps.
- **init.sh**: Environment initialization that detects project type (Node/Python/Go/Rust) and installs dependencies.
- **session_start.sh**: Run at start of each session - displays pwd, ls, feature list, progress log, git history/status, then runs init.sh.
- **verify.sh**: Validation script for testing core files and launching dev server.
- **commit_and_update.sh**: Auto-commit script that analyzes changes and generates commit messages with Co-Authored-By tag.
- **app_spec.template.txt**: Template for project specifications (referenced but not typically modified directly).

When updating feature_list.json:
- Change task status from "pending" → "done" when completed
- Include detailed steps array for each feature
- Categories: "foundation" (infrastructure), "automation" (tooling), "mltutor" (algorithms), "git" (version control)
