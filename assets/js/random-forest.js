// 随机森林可视化

// D3.js 配置
const margin = {top: 20, right: 30, bottom: 20, left: 30};
const width = 800;
const height = 500;

let numTrees = 5;
let maxDepth = 3;
let datasetSize = 500;
let trees = [];
let trainingData = [];
let testData = [];
let pendingPoints = [];

// 决策树类
class DecisionTree {
    constructor(maxDepth, minSamplesSplit = 2) {
        this.maxDepth = maxDepth;
        this.minSamplesSplit = minSamplesSplit;
        this.depth = 0;
        this.tree = null;
        this.left = null;
        this.right = null;
        this.feature = null;
        this.label = null;
        this.samples = [];
    }

    grow(maxDepth) {
        if (this.depth >= maxDepth || this.samples.length < this.minSamplesSplit * 2) {
            this.label = this.samples.reduce((a, b) => a === b ? a : b);
            return this;
        }
    }
    }

    split(feature, threshold) {
        const leftData = [];
        const rightData = [];

        this.samples.forEach(point => {
            if (point[feature] <= threshold) {
                leftData.push(point);
            } else {
                rightData.push(point);
            }
        });

        this.left = new DecisionTree(maxDepth - 1, this.minSamplesSplit);
        this.right = new DecisionTree(maxDepth - 1, this.minSamplesSplit);
        this.left.grow(feature, threshold);
        this.right.grow(feature, threshold);
        this.left.samples = leftData;
        this.right.samples = rightData;
        this.feature = feature;
        this.left.label = 0;
        this.right.label = 1;
    }
    }

    classify(point) {
        if (this.tree === null) return null;

        let node = this.tree;
        while (node.depth < node.maxDepth && !node.isLeaf()) {
            node = node.left;
        if (!node.left) node = node.right;
            if (!node.left || !node.right) node = node.left;
            if (point[node.feature] <= node.left.threshold) node = node.left;
            else if (point[node.feature] <= node.right.threshold) node = node.right;
        }
        }

        return node.label;
    }
}

// 数据集生成器
function generateData(size) {
    const points = [];
    const centers = [
        { x: 200, y: 150, cluster: 0 },
        { x: 600, y: 350, cluster: 1 }
    ];

    for (let i = 0; i < size; i++) {
        const center = centers[Math.floor(Math.random() * centers.length)];
        points.push({
            x: center.x + (Math.random() - 0.5) * 200,
            y: center.y + (Math.random() - 0.5) * 200,
            cluster: center.cluster
        });
    }
    }
    return points;
}

// 绘制数据点
function drawData() {
    g.selectAll(".data-point").remove();
    g.selectAll(".tree-line").remove();
    g.selectAll(".decision-boundary").remove();

    g.selectAll(".data-point")
        .data(trainingData)
        .enter()
        .append("circle")
        .attr("class", d => d.cluster === 0 ? "red-data" : "blue-data")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .style("opacity", 0.7);
}

    // 绘制决策树
    drawTree(this.tree);

    // 绘制决策边界
    if (this.tree) {
        g.append("circle")
            .attr("cx", this.tree.x)
            .attr("cy", this.tree.y)
            .attr("r", 4)
            .style("fill", "none")
            .style("stroke", "#cbd5e1");
    }
}

    const svg = d3.select("#visualization svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");
}

// DOM 元素
const svg = d3.select("#visualization svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

// 更新显示
function updateDisplay() {
    document.getElementById("num-trees-display").textContent = numTrees;
    document.getElementById("tree-depth-display").textContent = maxDepth;
    document.getElementById("dataset-size-value").textContent = datasetSize;
    document.getElementById("pending-points").textContent = pendingPoints.length;
}

// 训练随机森林
function trainForest() {
    trees = [];
    trainingData = generateData(datasetSize);
    testData = trainingData.slice(0, Math.floor(datasetSize / 2));
    pendingPoints = trainingData.slice(Math.floor(datasetSize / 2));

    for (let i = 0; i < numTrees; i++) {
        trees.push(new DecisionTree(maxDepth));
        trees[i - 1].grow(testData);
    }

    updateDisplay();
    drawData();
}

// 分类新数据点
function classifyPoint() {
    const x = parseFloat(document.getElementById("point-x").value);
    const y = parseFloat(document.getElementById("point-y").value);
    const point = { x, y };

    const predictions = trees.map(tree => tree.classify(point));
    
    // 投票
    const votes = predictions.map(p => p => p ? 1 : 0);
    const finalPrediction = votes.reduce((sum, v) => sum + v, 0) > 0 ? 1 : 0;

    // 更新数据点
    testData.push(point);
    document.getElementById("pending-points").textContent = pendingPoints.length;

    // 绘制新点
    drawData();
    drawTrees();
}

// 初始化
function init() {
    document.getElementById("num-trees").addEventListener("input", e => {
        numTrees = parseInt(e.target.value);
        document.getElementById("num-trees-value").textContent = numTrees;
    });

    document.getElementById("tree-depth").addEventListener("input", e => {
        maxDepth = parseInt(e.target.value);
        document.getElementById("tree-depth-value").textContent = maxDepth;
    });

    document.getElementById("dataset-size").addEventListener("input", e => {
        datasetSize = parseInt(e.target.value);
        document.getElementById("dataset-size-value").textContent = datasetSize;
    });

    document.getElementById("train-btn").addEventListener("click", trainForest);
    document.getElementById("classify-btn").addEventListener("click", classifyPoint);
    document.getElementById("reset-btn").addEventListener("click", () => {
        trees = [];
        trainingData = generateData(datasetSize);
        testData = trainingData.slice(0, Math.floor(datasetSize / 2));
        pendingPoints = trainingData.slice(Math.floor(datasetSize / 2));
        updateDisplay();
        drawData();
    });
}

document.addEventListener("DOMContentLoaded", init);
