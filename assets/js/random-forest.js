// 随机森林可视化

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

let svg, g;

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
    return points;
}

// 简化决策树
class SimpleDecisionTree {
    constructor(depth = 0) {
        this.depth = depth;
        this.feature = null;
        this.threshold = null;
        this.label = null;
        this.left = null;
        this.right = null;
    }

    train(data, maxDepth) {
        if (this.depth >= maxDepth || data.length < 5) {
            // 叶节点：多数投票
            const counts = [0, 0];
            data.forEach(p => counts[p.cluster]++);
            this.label = counts[0] > counts[1] ? 0 : 1;
            return;
        }

        // 随机选择分割点和阈值
        this.feature = Math.random() > 0.5 ? 'x' : 'y';
        const values = data.map(p => p[this.feature]).sort((a, b) => a - b);
        this.threshold = values[Math.floor(values.length / 2)];

        const leftData = data.filter(p => p[this.feature] <= this.threshold);
        const rightData = data.filter(p => p[this.feature] > this.threshold);

        if (leftData.length > 0) {
            this.left = new SimpleDecisionTree(this.depth + 1);
            this.left.train(leftData, maxDepth);
        }
        if (rightData.length > 0) {
            this.right = new SimpleDecisionTree(this.depth + 1);
            this.right.train(rightData, maxDepth);
        }

        // 如果没有分割成功，设为叶节点
        if (!this.left && !this.right) {
            const counts = [0, 0];
            data.forEach(p => counts[p.cluster]++);
            this.label = counts[0] > counts[1] ? 0 : 1;
        }
    }

    predict(point) {
        if (this.label !== null) return this.label;
        if (!this.feature || this.threshold === null) return 0;

        if (point[this.feature] <= this.threshold) {
            return this.left ? this.left.predict(point) : 0;
        } else {
            return this.right ? this.right.predict(point) : 1;
        }
    }
}

// 绘制数据点
function drawData() {
    g.selectAll(".data-point").remove();
    g.selectAll(".decision-boundary").remove();

    // 绘制决策边界背景
    if (trees.length > 0) {
        const resolution = 20;
        for (let x = 0; x < width; x += resolution) {
            for (let y = 0; y < height; y += resolution) {
                const point = { x: x + resolution/2, y: y + resolution/2 };
                const predictions = trees.map(tree => tree.predict(point));
                const votes = predictions.reduce((sum, p) => sum + p, 0);
                const avgVote = votes / trees.length;

                g.append("rect")
                    .attr("class", "decision-boundary")
                    .attr("x", x)
                    .attr("y", y)
                    .attr("width", resolution)
                    .attr("height", resolution)
                    .attr("fill", avgVote > 0.5 ? "rgba(59, 130, 246, 0.15)" : "rgba(239, 68, 68, 0.15)");
            }
        }
    }

    // 绘制数据点
    g.selectAll(".data-point")
        .data(trainingData)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .style("fill", d => d.cluster === 0 ? "#ef4444" : "#3b82f6")
        .style("opacity", 0.7)
        .style("stroke", "#fff")
        .style("stroke-width", 1);
}

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
        // Bootstrap 采样
        const sampleIndices = [];
        for (let j = 0; j < testData.length; j++) {
            sampleIndices.push(Math.floor(Math.random() * testData.length));
        }
        const sample = sampleIndices.map(idx => testData[idx]);

        const tree = new SimpleDecisionTree(0);
        tree.train(sample, maxDepth);
        trees.push(tree);
    }

    updateDisplay();
    drawData();
}

// 分类新数据点（随机生成）
function classifyPoint() {
    if (pendingPoints.length === 0) {
        pendingPoints = generateData(50);
    }

    const point = pendingPoints.pop();
    const predictions = trees.map(tree => tree.predict(point));

    // 投票
    const votes = predictions.reduce((sum, p) => sum + p, 0);
    point.predictedLabel = votes > trees.length / 2 ? 1 : 0;

    trainingData.push(point);
    document.getElementById("pending-points").textContent = pendingPoints.length;

    drawData();
}

// 重置
function resetForest() {
    trees = [];
    trainingData = generateData(datasetSize);
    testData = trainingData.slice(0, Math.floor(datasetSize / 2));
    pendingPoints = trainingData.slice(Math.floor(datasetSize / 2));
    updateDisplay();
    drawData();
}

// 初始化
function init() {
    // 创建 SVG
    svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    g = svg.append("g");

    // 背景区域
    g.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f8f9fa")
        .attr("rx", 8);

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
    document.getElementById("reset-btn").addEventListener("click", resetForest);

    // 初始化数据
    trainingData = generateData(datasetSize);
    updateDisplay();
}

document.addEventListener("DOMContentLoaded", init);
