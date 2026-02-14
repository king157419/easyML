// MLTutor - 线性回归可视化

// 全局变量
let slope = 1.0;
let intercept = 0.0;
let noise = 0.5;
let numSamples = 30;
let data = [];

// D3 选择
const vizContainer = d3.select('#visualization');
let svg, g, xScale, yScale;

// 初始化可视化
function initVisualization() {
    const width = vizContainer.node().clientWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };

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
        .domain([-6, 6])
        .range([0, width - margin.left - margin.right]);

    yScale = d3.scaleLinear()
        .domain([-6, 6])
        .range([height - margin.top - margin.bottom, 0]);

    // 添加坐标轴
    g.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    g.append('g')
        .call(d3.axisLeft(yScale));

    // 添加轴标签
    g.append('text')
        .attr('x', width / 2 - margin.left)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#4a5568')
        .text('x (特征)');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2 - margin.bottom))
        .attr('y', -45)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#4a5568')
        .text('y (目标)');

    // 生成初始数据
    generateData();

    // 渲染可视化
    renderVisualization();
}

// 生成数据
function generateData() {
    data = [];
    const trueSlope = 0.8 + Math.random() * 0.4;  // 真实斜率 0.8-1.2
    const trueIntercept = Math.random() * 2 - 1;  // 真实截距 -1 到 1

    for (let i = 0; i < numSamples; i++) {
        const x = Math.random() * 10 - 5;  // x 在 [-5, 5] 范围
        const trueY = trueSlope * x + trueIntercept;
        const y = trueY + (Math.random() - 0.5) * 2 * noise;
        data.push({ x, y });
    }
}

// 渲染可视化
function renderVisualization() {
    if (!svg) return;

    const width = svg.node().clientWidth;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // 绘制残差线（从数据点到拟合线）
    const residualLines = g.selectAll('.residual-line')
        .data(data);

    residualLines.enter()
        .append('line')
        .attr('class', 'residual-line')
        .style('stroke', '#ef4444')
        .style('stroke-width', '1')
        .style('stroke-dasharray', '4,4')
        .style('opacity', '0.5')
        .merge(residualLines)
        .attr('x1', d => xScale(d.x))
        .attr('y1', d => yScale(d.y))
        .attr('x2', d => xScale(d.x))
        .attr('y2', d => yScale(slope * d.x + intercept));

    residualLines.exit().remove();

    // 绘制拟合线
    const lineData = [
        { x: -6, y: slope * -6 + intercept },
        { x: 6, y: slope * 6 + intercept }
    ];

    const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    const fitLine = g.selectAll('.fit-line')
        .data([lineData]);

    fitLine.enter()
        .append('path')
        .attr('class', 'fit-line')
        .style('fill', 'none')
        .style('stroke', '#2563eb')
        .style('stroke-width', '3')
        .merge(fitLine)
        .attr('d', line);

    fitLine.exit().remove();

    // 绘制数据点
    const dots = g.selectAll('.data-point')
        .data(data);

    dots.enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('r', 6)
        .style('fill', '#7c3aed')
        .style('stroke', '#fff')
        .style('stroke-width', '2')
        .style('cursor', 'pointer')
        .merge(dots)
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y));

    dots.exit().remove();

    // 计算 MSE
    const mse = calculateMSE();
    document.getElementById('mse-value').textContent = mse.toFixed(4);

    // 更新方程显示
    const slopeText = slope.toFixed(2);
    const interceptText = intercept >= 0 ? `+ ${intercept.toFixed(2)}` : `- ${Math.abs(intercept).toFixed(2)}`;
    document.getElementById('equation').innerHTML = `${slopeText}x ${interceptText}`;
}

// 计算 MSE
function calculateMSE() {
    let sumSquaredErrors = 0;
    for (const point of data) {
        const predicted = slope * point.x + intercept;
        const error = point.y - predicted;
        sumSquaredErrors += error * error;
    }
    return sumSquaredErrors / data.length;
}

// 计算最优解（闭式解）
function calculateOptimalSolution() {
    const n = data.length;
    const sumX = d3.sum(data, d => d.x);
    const sumY = d3.sum(data, d => d.y);
    const sumXY = d3.sum(data, d => d.x * d.y);
    const sumXX = d3.sum(data, d => d.x * d.x);

    const meanX = sumX / n;
    const meanY = sumY / n;

    const optimalSlope = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX);
    const optimalIntercept = meanY - optimalSlope * meanX;

    return { slope: optimalSlope, intercept: optimalIntercept };
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 初始化可视化
    initVisualization();

    // 斜率滑块
    const slopeSlider = document.getElementById('slope-slider');
    slopeSlider.addEventListener('input', (e) => {
        slope = parseFloat(e.target.value);
        document.getElementById('slope-value').textContent = slope.toFixed(1);
        renderVisualization();
    });

    // 截距滑块
    const interceptSlider = document.getElementById('intercept-slider');
    interceptSlider.addEventListener('input', (e) => {
        intercept = parseFloat(e.target.value);
        document.getElementById('intercept-value').textContent = intercept.toFixed(1);
        renderVisualization();
    });

    // 噪声滑块
    const noiseSlider = document.getElementById('noise-slider');
    noiseSlider.addEventListener('input', (e) => {
        noise = parseFloat(e.target.value);
        document.getElementById('noise-value').textContent = noise.toFixed(1);
        generateData();
        renderVisualization();
    });

    // 样本数滑块
    const samplesSlider = document.getElementById('samples-slider');
    samplesSlider.addEventListener('input', (e) => {
        numSamples = parseInt(e.target.value);
        document.getElementById('samples-value').textContent = numSamples;
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
