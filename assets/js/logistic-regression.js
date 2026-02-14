// MLTutor - 逻辑回归可视化

// 全局变量
let w1 = 1.0;
let w2 = 1.0;
let b = 0.0;
let separation = 1.5;
let data = [];

// D3 选择
const vizContainer = d3.select('#visualization');
let svg, g, xScale, yScale, colorScale;

// 初始化可视化
function initVisualization() {
    const width = vizContainer.node().clientWidth;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    // 清空容器
    vizContainer.selectAll('*').remove();

    // 创建 SVG
    svg = vizContainer.append('svg')
        .attr('width', width)
        .attr('height', height);

    // 创建主组
    g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 创建比例尺
    xScale = d3.scaleLinear()
        .domain([-5, 5])
        .range([0, width - margin.left - margin.right]);

    yScale = d3.scaleLinear()
        .domain([-5, 5])
        .range([height - margin.top - margin.bottom, 0]);

    // 颜色比例尺
    colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(['#ef4444', '#2563eb']);  // 红 → 蓝

    // 添加坐标轴
    g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5));

    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5));

    // 生成初始数据
    generateData();

    // 渲染可视化
    renderVisualization();
}

// 生成数据
function generateData() {
    data = [];
    const numSamples = 50;

    // 类别 0（红色）
    for (let i = 0; i < numSamples; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * 1.5;
        data.push({
            x1: Math.cos(angle) * radius * separation,
            x2: Math.sin(angle) * radius * separation,
            label: 0
        });
    }

    // 类别 1（蓝色）
    for (let i = 0; i < numSamples; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * 1.5;
        data.push({
            x1: Math.cos(angle) * radius * separation + 2,
            x2: Math.sin(angle) * radius * separation + 2,
            label: 1
        });
    }
}

// Sigmoid 函数
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

// 渲染可视化
function renderVisualization() {
    if (!svg) return;

    const width = svg.node().clientWidth;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // 清除旧的层
    g.selectAll('.decision-boundary').remove();
    g.selectAll('.prob-contour').remove();
    g.selectAll('.data-point').remove();

    // 创建网格用于等高线
    const gridSize = 50;
    const gridData = [];
    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
            const x1 = -5 + (10 / gridSize) * i;
            const x2 = -5 + (10 / gridSize) * j;
            const z = w1 * x1 + w2 * x2 + b;
            const prob = sigmoid(z);
            gridData.push({ x1, x2, prob });
        }
    }

    // 绘制等高线（概率）
    const contourData = d3.contours()
        .size([plotWidth, plotHeight])
        .thresholds(d3.range(0.1, 1, 0.1))
        (gridData.map(d => [xScale(d.x1), yScale(d.x2), d.prob]));

    const contours = g.selectAll('.prob-contour')
        .data(contourData);

    contours.enter()
        .append('path')
        .attr('class', 'prob-contour')
        .style('fill', 'none')
        .style('stroke', d => {
            const level = d.level;
            if (level < 0.5) return '#ef4444';
            if (level < 0.7) return '#f59e0b';
            return '#2563eb';
        })
        .style('stroke-width', d => Math.abs(d.level - 0.5) < 0.1 ? 3 : 1)
        .style('stroke-dasharray', '4,4')
        .style('opacity', 0.6)
        .attr('d', d3.geoPath(d.p));

    // 绘制决策边界（z = 0）
    const boundaryLine = [];
    for (let x1 = -5; x1 <= 5; x1 += 0.5) {
        const x2 = (-w1 * x1 - b) / w2;
        if (x2 >= -5 && x2 <= 5) {
            boundaryLine.push({ x1, x2 });
        }
    }

    const boundary = g.selectAll('.decision-boundary')
        .data([boundaryLine]);

    boundary.enter()
        .append('path')
        .attr('class', 'decision-boundary')
        .style('fill', 'none')
        .style('stroke', '#10b981')
        .style('stroke-width', 3)
        .attr('d', d3.line()
            .x(d => xScale(d.x1))
            .y(d => yScale(d.x2))
            .curve(d3.curveLinear)(boundaryLine));

    // 绘制数据点
    const dots = g.selectAll('.data-point')
        .data(data);

    dots.enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('r', 7)
        .style('fill', d => d.label === 0 ? '#ef4444' : '#2563eb')
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('opacity', 0.8)
        .merge(dots)
        .attr('cx', d => xScale(d.x1))
        .attr('cy', d => yScale(d.x2));

    dots.exit().remove();

    // 更新显示
    document.getElementById('w1-display').textContent = w1.toFixed(1);
    document.getElementById('w2-display').textContent = w2.toFixed(1);
    document.getElementById('b-display').textContent = b.toFixed(1);
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 初始化可视化
    initVisualization();

    // w1 滑块
    document.getElementById('w1-slider').addEventListener('input', (e) => {
        w1 = parseFloat(e.target.value);
        document.getElementById('w1-value').textContent = w1.toFixed(1);
        renderVisualization();
    });

    // w2 滑块
    document.getElementById('w2-slider').addEventListener('input', (e) => {
        w2 = parseFloat(e.target.value);
        document.getElementById('w2-value').textContent = w2.toFixed(1);
        renderVisualization();
    });

    // b 滑块
    document.getElementById('b-slider').addEventListener('input', (e) => {
        b = parseFloat(e.target.value);
        document.getElementById('b-value').textContent = b.toFixed(1);
        renderVisualization();
    });

    // 数据分离度滑块
    document.getElementById('separation-slider').addEventListener('input', (e) => {
        separation = parseFloat(e.target.value);
        document.getElementById('separation-value').textContent = separation.toFixed(1);
        generateData();
        renderVisualization();
    });

    // 生成新数据按钮
    document.getElementById('generate-btn').addEventListener('click', () => {
        generateData();
        renderVisualization();
    });
});

// 窗口大小改变时重新初始化
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initVisualization, 300);
});
