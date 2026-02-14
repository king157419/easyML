// MLTutor - KNN 聚类可视化

// 全局变量
let k = 3;
let distanceMetric = 'euclidean';
let currentDataset = 'circles';
let mode = 'view';
let trainData = [];
let testData = [];
let hoveredPoint = null;

// D3 选择
const vizContainer = d3.select('#visualization');
let svg, g, xScale, yScale;

// 距离计算函数
function euclideanDistance(a, b) {
    return Math.sqrt(Math.pow(a.x1 - b.x1, 2) + Math.pow(a.x2 - b.x2, 2));
}

function manhattanDistance(a, b) {
    return Math.abs(a.x1 - b.x1) + Math.abs(a.x2 - b.x2);
}

function distance(a, b) {
    return distanceMetric === 'euclidean' ? euclideanDistance(a, b) : manhattanDistance(a, b);
}

// KNN 预测
function predictKNN(point, data, k) {
    // 计算到所有训练点的距离
    const distances = data.map(d => ({
        point: d,
        dist: distance(point, d)
    }));

    // 按距离排序
    distances.sort((a, b) => a.dist - b.dist);

    // 取前 k 个
    const neighbors = distances.slice(0, k);

    // 投票
    const votes = { 0: 0, 1: 0 };
    neighbors.forEach(n => {
        votes[n.point.label]++;
    });

    // 返回预测类别和邻居
    const prediction = votes[0] > votes[1] ? 0 : 1;
    return {
        prediction,
        neighbors: neighbors.map(n => n.point),
        distances: neighbors.map(n => n.dist),
        confidence: Math.max(votes[0], votes[1]) / k
    };
}

// 生成数据
function generateData(type) {
    trainData = [];
    const numSamples = 60;

    if (type === 'circles') {
        // 同心圆数据
        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * Math.PI * 2;
            const radius = 1.5 + Math.random() * 0.8;
            trainData.push({
                x1: Math.cos(angle) * radius,
                x2: Math.sin(angle) * radius,
                label: 0
            });
        }
        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * Math.PI * 2;
            const radius = 3 + Math.random() * 1;
            trainData.push({
                x1: Math.cos(angle) * radius,
                x2: Math.sin(angle) * radius,
                label: 1
            });
        }
    } else if (type === 'moons') {
        // 月牙形数据
        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * Math.PI;
            const radius = 2 + Math.random() * 0.8;
            trainData.push({
                x1: Math.cos(angle) * radius,
                x2: Math.sin(angle) * radius - 1,
                label: 0
            });
        }
        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * Math.PI;
            const radius = 2 + Math.random() * 0.8;
            trainData.push({
                x1: -Math.cos(angle) * radius + 0.5,
                x2: -Math.sin(angle) * radius + 1,
                label: 1
            });
        }
    } else if (type === 'blobs') {
        // 高斯簇数据
        for (let i = 0; i < numSamples; i++) {
            trainData.push({
                x1: (Math.random() - 0.5) * 3 - 1.5,
                x2: (Math.random() - 0.5) * 3 + 1,
                label: 0
            });
        }
        for (let i = 0; i < numSamples; i++) {
            trainData.push({
                x1: (Math.random() - 0.5) * 3 + 1.5,
                x2: (Math.random() - 0.5) * 3 - 1,
                label: 1
            });
        }
    }
}

// 绘制决策边界（简化版 - 使用 Voronoi 的思想）
function drawDecisionBoundary() {
    const gridSize = 40;
    const width = vizContainer.node().clientWidth - 60;
    const height = 400;
    const predictions = [];

    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            const x1 = -5 + (10 / gridSize) * i;
            const x2 = -5 + (10 / gridSize) * j;
            const result = predictKNN({ x1, x2 }, trainData, k);
            predictions.push({ x1, x2, prediction: result.prediction });
        }
    }

    // 绘制等高线
    const contourData = d3.contours()
        .size([width, height])
        .thresholds([0.5])
        (predictions.map(d => [xScale(d.x1), yScale(d.x2), d.prediction]));

    g.selectAll('.decision-boundary')
        .data(contourData)
        .enter()
        .append('path')
        .attr('class', 'decision-boundary')
        .style('fill', 'none')
        .style('stroke', '#10b981')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.5)
        .attr('d', d3.geoPath(d.p));
}

// 初始化可视化
function initVisualization() {
    const width = vizContainer.node().clientWidth;
    const height = 450;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    vizContainer.selectAll('*').remove();

    svg = vizContainer.append('svg')
        .attr('width', width)
        .attr('height', height);

    g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    xScale = d3.scaleLinear()
        .domain([-5, 5])
        .range([0, width - margin.left - margin.right]);

    yScale = d3.scaleLinear()
        .domain([-5, 5])
        .range([height - margin.top - margin.bottom, 0]);

    g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5));

    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5));

    // 生成初始数据
    generateData(currentDataset);
    renderVisualization();
}

// 渲染可视化
function renderVisualization() {
    if (!svg) return;

    const plotWidth = svg.node().clientWidth - 60;
    const plotHeight = 400;

    // 清除旧元素
    g.selectAll('.decision-boundary').remove();
    g.selectAll('.decision-region').remove();
    g.selectAll('.neighbor-line').remove();
    g.selectAll('.train-point').remove();
    g.selectAll('.test-point').remove();
    g.selectAll('.neighbor-circle').remove();

    // 绘制决策边界（半透明区域）
    const gridSize = 50;
    const gridData = [];
    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            const x1 = -5 + (10 / gridSize) * i;
            const x2 = -5 + (10 / gridSize) * j;
            const result = predictKNN({ x1, x2 }, trainData, k);
            gridData.push({ x1, x2, prediction: result.prediction });
        }
    }

    // 创建小方块表示决策区域
    const cellSize = (plotWidth / gridSize);
    g.selectAll('.decision-region')
        .data(gridData)
        .enter()
        .append('rect')
        .attr('class', 'decision-region')
        .attr('x', d => xScale(d.x1) - cellSize / 2)
        .attr('y', d => yScale(d.x2) - cellSize / 2)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .style('fill', d => d.prediction === 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)')
        .style('stroke', 'none');

    // 绘制训练数据点
    g.selectAll('.train-point')
        .data(trainData)
        .enter()
        .append('circle')
        .attr('class', 'train-point')
        .attr('r', 6)
        .style('fill', d => d.label === 0 ? '#ef4444' : '#2563eb')
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('opacity', 0.7)
        .attr('cx', d => xScale(d.x1))
        .attr('cy', d => yScale(d.x2));

    // 绘制测试数据点
    g.selectAll('.test-point')
        .data(testData)
        .enter()
        .append('circle')
        .attr('class', 'test-point')
        .attr('r', 10)
        .style('fill', '#fbbf24')
        .style('stroke', '#fff')
        .style('stroke-width', 3)
        .style('cursor', 'pointer')
        .attr('cx', d => xScale(d.x1))
        .attr('cy', d => yScale(d.x2))
        .on('mouseover', function(event, d) {
            hoveredPoint = d;
            showNeighbors(d);
        })
        .on('mouseout', function() {
            hoveredPoint = null;
            g.selectAll('.neighbor-line').remove();
            g.selectAll('.neighbor-circle').remove();
        });

    // 如果有悬停点，显示邻居
    if (hoveredPoint) {
        showNeighbors(hoveredPoint);
    }
}

// 显示 K 近邻
function showNeighbors(point) {
    const result = predictKNN(point, trainData, k);

    // 绘制连线
    g.selectAll('.neighbor-line')
        .data(result.neighbors)
        .enter()
        .append('line')
        .attr('class', 'neighbor-line')
        .attr('x1', xScale(point.x1))
        .attr('y1', yScale(point.x2))
        .attr('x2', d => xScale(d.x1))
        .attr('y2', d => yScale(d.x2))
        .style('stroke', '#fbbf24')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '4,4')
        .style('opacity', 0.8);

    // 高亮邻居点
    g.selectAll('.neighbor-circle')
        .data(result.neighbors)
        .enter()
        .append('circle')
        .attr('class', 'neighbor-circle')
        .attr('r', 12)
        .style('fill', 'none')
        .style('stroke', '#fbbf24')
        .style('stroke-width', 3)
        .attr('cx', d => xScale(d.x1))
        .attr('cy', d => yScale(d.x2));

    // 更新显示信息
    document.getElementById('k-value').textContent = k + ' (预测: ' + (result.prediction === 0 ? '红' : '蓝') + ', 置信度: ' + (result.confidence * 100).toFixed(0) + '%)';
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    initVisualization();

    // K 滑块
    document.getElementById('k-slider').addEventListener('input', (e) => {
        k = parseInt(e.target.value);
        document.getElementById('k-value').textContent = k;
        renderVisualization();
    });

    // 距离度量选择
    document.getElementById('distance-select').addEventListener('change', (e) => {
        distanceMetric = e.target.value;
        renderVisualization();
    });

    // 数据集选择
    document.getElementById('dataset-select').addEventListener('change', (e) => {
        currentDataset = e.target.value;
        generateData(currentDataset);
        testData = [];
        renderVisualization();
    });

    // 模式选择
    document.getElementById('mode-select').addEventListener('change', (e) => {
        mode = e.target.value;
        svg.style('cursor', mode === 'add' ? 'crosshair' : 'default');
    });

    // 生成新数据
    document.getElementById('generate-btn').addEventListener('click', () => {
        generateData(currentDataset);
        testData = [];
        renderVisualization();
    });

    // 清除测试点
    document.getElementById('clear-btn').addEventListener('click', () => {
        testData = [];
        renderVisualization();
    });

    // 点击添加测试点
    svg.on('click', function(event) {
        if (mode !== 'add') return;

        const [mx, my] = d3.pointer(event);
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const x1 = xScale.invert(mx - margin.left);
        const x2 = yScale.invert(my - margin.top);

        if (x1 >= -5 && x1 <= 5 && x2 >= -5 && x2 <= 5) {
            testData.push({ x1, x2 });
            renderVisualization();
        }
    });
});

// 窗口大小改变时重新初始化
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initVisualization, 300);
});
