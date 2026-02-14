# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MLTutor** is a machine learning visualization education platform (机器学习可视化教学平台), inspired by 李宏毅's ML course and built using Anthropic's "Effective harnesses for long-running agents" pattern.

- **Tech Stack**: Pure HTML/CSS/JavaScript (no build step required)
- **CDN Dependencies**: D3.js, Plotly.js, KaTeX (loaded via CDN in HTML)
- **Development**: Open HTML files directly in browser, or use simple HTTP server

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
- `knowledgeData` object contains the full ML algorithm hierarchy
- Nodes are colored by `visualLevel` (1-5) indicating visualization complexity
- Clickable nodes link to `algorithms/[name]/index.html`
- Category-level coloring: supervised (L1), unsupervised (L1), reinforcement (L1)

## Algorithm Page Template

When adding a new algorithm:
1. Copy `algorithms/template.html` to `algorithms/[name]/index.html`
2. Replace placeholders: `{{ALGORITHM_NAME}}`, `{{ALGORITHM_ID}}`, `{{ALGORITHM_INTRO}}`, etc.
3. Create corresponding `assets/js/[name].js` with D3.js/Plotly.js visualization
4. Update `knowledgeData` in `knowledge-graph.js` to add the new node
5. Add `notebook.ipynb` if applicable

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
