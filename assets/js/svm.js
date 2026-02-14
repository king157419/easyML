// MLTutor - SVM 交互式参数探索

// 全局变量
let C = 1.0;
let kernel = 'linear';  // linear, rbf, poly
let gamma = 1.0;
let data = [];
let supportVectors = [];

// D3 选择
const vizContainer = d3.select('#visualization');
let svg, g, xScale, yScale;

// 简化的 SVM 实现（仅用于可视化）
function trainSVM() {
    // 根据核函数类型生成决策边界
    // 这是简化版本，真实 SVM 需要求解二次规划

    if (kernel === 'linear') {
        // 线性核：w·x + b = 0
        // 简化：用数据点的平均方向
        let class0 = data.filter(d => d.label === 0);
        let class1 = data.filter(d => d.label === 1);

        const mean0 = {
            x1: d3.mean(class0, d => d.x1),
            x2: d3.mean(class0, d => d.x2)
        };
        const mean1 = {
            x1: d3.mean(class1, d => d.x1),
            x2: d3.mean(class1, d => d.x2)
        };

        // 法向量（简化）
        const nx = mean1.x1 - mean0.x1;
        const ny = mean1.x2 - mean0.x2;
        const norm = Math.sqrt(nx * nx + ny * ny);

        // C 参数影响：C 越小，边界越靠近中间
        const cFactor = 1 / Math.sqrt(C);

        // 边界线：w·x + b = 0
        const w = { x1: nx / norm, x2: ny / norm };
        const midPoint = {
            x1: (mean0.x1 + mean1.x1) / 2 + (Math.random() - 0.5) * cFactor,
            x2: (mean0.x2 + mean1.x2) / 2 + (Math.random() - 0.5) * cFactor
        };
        const b = -(w.x1 * midPoint.x1 + w.x2 * midPoint.x2);

        return { type: 'linear', w, b };
    } else if (kernel === 'rbf') {
        // RBF 核：简化处理
        const class0 = data.filter(d => d.label === 0);
        const class1 = data.filter(d => d.label === 1);

        const mean0 = { x1: d3.mean(class0, d => d.x1), x2: d3.mean(class0, d => d.x2) };
        const mean1 = { x1: d3.mean(class1, d => d.x1), x2: d3.mean(class1, d => d.x2) };

        // Gamma 影响：gamma 越大，边界越复杂
        const gammaFactor = 1 / (gamma * 2);

        return {
            type: 'rbf',
            center0: mean0,
            center1: mean1,
            gamma: gamma,
            sigma: Math.sqrt(gammaFactor)
        };
    } else {
        // 多项式核：类似 RBF
        const class0 = data.filter(d => d.label === 0);
        const class1 = data.filter(d => d.label === 1);

        const mean0 = { x1: d3.mean(class0, d => d.x1), x2: d3.mean(class0, d => d.x2) };
        const mean1 = { x1: d3.mean(class1, d => d.x1), x2: d3.mean(class1, d => d.x2) };

        return {
            type: 'poly',
            center0: mean0,
            center1: mean1
        };
    }
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

    generateData();
    renderVisualization();
}

// 生成数据
function generateData() {
    data = [];
    const numSamples = 40;

    // 两类数据（月牙形分布）
    for (let i = 0; i < numSamples; i++) {
        const angle = (i / numSamples) * Math.PI * 2;
        const radius = 2 + (Math.random() - 0.5);
        const label = i < numSamples / 2 ? 0 : 1;

        data.push({
            x1: Math.cos(angle) * radius + (label === 0 ? -2 : 2),
            x2: Math.sin(angle) * radius,
            label
        });
    }
}

// 渲染可视化
function renderVisualization() {
    if (!svg) return;

    // 清除旧元素
    g.selectAll('.decision-boundary').remove();
    g.selectAll('.margin-region').remove();
    g.selectAll('.support-vector').remove();
    g.selectAll('.data-point').remove();

    const model = trainSVM();

    // 绘制决策边界
    if (model.type === 'linear') {
        // 线性边界：w·x + b = 0
        const lineData = [];
        for (let x1 = -5; x1 <= 5; x1 += 0.1) {
            const x2 = (-model.w.x1 * x1 - model.b) / model.w.x2;
            if (x2 >= -5 && x2 <= 5) {
                lineData.push({ x1, x2 });
            }
        }

        g.append('path')
            .datum(lineData)
            .attr('class', 'decision-boundary')
            .style('fill', 'none')
            .style('stroke', '#10b981')
            .style('stroke-width', 3)
            .attr('d', d3.line()
                .x(d => xScale(d.x1))
                .y(d => yScale(d.x2))
                .curve(d3.curveLinear));

        // 绘制边距区域（简化）
        const margin = 0.5 / Math.sqrt(C);
        const upperLine = lineData.map(d => ({ x1: d.x1, x2: d.x2 + margin * model.w.x1 }));
        const lowerLine = lineData.map(d => ({ x1: d.x1, x2: d.x2 - margin * model.w.x2 }));

        g.append('path')
            .datum(upperLine)
            .style('fill', 'rgba(16, 185, 129, 0.1)')
            .style('stroke', 'none')
            .attr('d', d3.line()
                .x(d => xScale(d.x1))
                .y(d => yScale(d.x2))
                .curve(d3.curveLinear) +
                d3.line()
                .x(d => xScale(d.x1))
                .y(d => yScale(lowerLine[lowerLine.length - 1 - lowerLine.findIndex(p => p.x1 === d.x1)].x2))
                .curve(d3.curveLinear));

        // 计算支持向量（简化：离边界最近的点）
        const distances = data.map(d => {
            point: d,
            dist: Math.abs(model.w.x1 * d.x1 + model.w.x2 * d.x2 + model.b)
        });
        distances.sort((a, b) => a.dist - b.dist);

        // 选择前 20% 作为支持向量
        const svCount = Math.max(3, Math.floor(data.length * 0.2));
        supportVectors = distances.slice(0, svCount).map(d => d.point);

        document.getElementById('sv-count').textContent = svCount;
        document.getElementById('margin-width').textContent = margin.toFixed(2);

    } else {
        // RBF/多项式：绘制等高线
        const gridSize = 40;
        const gridData = [];
        for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
                const x1 = -5 + (10 / gridSize) * i;
                const x2 = -5 + (10 / gridSize) * j;

                // 简化的决策函数
                const d0 = Math.sqrt(
                    Math.pow(x1 - model.center0.x1, 2) +
                    Math.pow(x2 - model.center0.x2, 2)
                );
                const d1 = Math.sqrt(
                    Math.pow(x1 - model.center1.x1, 2) +
                    Math.pow(x2 - model.center1.x2, 2)
                );

                let decision;
                if (model.type === 'rbf') {
                    const k0 = Math.exp(-model.gamma * d0 * d0);
                    const k1 = Math.exp(-model.gamma * d1 * d1);
                    decision = k1 - k0;
                } else {
                    decision = d1 - d0;
                }

                gridData.push({ x1, x2, decision });
            }
        }

        // 绘制等高线（决策边界）
        const contourData = d3.contours()
            .size([svg.node().clientWidth - 60, 390])
            .thresholds([0])
            (gridData.map(d => [xScale(d.x1), yScale(d.x2), d.decision]));

        g.selectAll('.contour')
            .data(contourData)
            .enter()
            .append('path')
            .attr('class', 'decision-boundary')
            .style('fill', 'none')
            .style('stroke', '#10b981')
            .style('stroke-width', 3)
            .attr('d', d3.geoPath()
                .x(d => d[0])
                .y(d => d[1])
                .curve(d3.curveLinear)(d.p));

        document.getElementById('sv-count').textContent = 'N/A (RBF)';
        document.getElementById('margin-width').textContent = 'N/A (RBF)';
    }

    // 绘制支持向量
    g.selectAll('.support-vector')
        .data(supportVectors)
        .enter()
        .append('circle')
        .attr('class', 'support-vector')
        .attr('r', 10)
        .style('fill', 'none')
        .style('stroke', '#f59e0b')
        .style('stroke-width', 3)
        .style('stroke-dasharray', '5,5')
        .merge(g.selectAll('.support-vector'))
        .attr('cx', d => xScale(d.x1))
        .attr('cy', d => yScale(d.x2));

    // 绘制数据点
    const dots = g.selectAll('.data-point')
        .data(data);

    dots.enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('r', 6)
        .style('fill', d => d.label === 0 ? '#ef4444' : '#2563eb')
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('opacity', 0.8)
        .merge(dots)
        .attr('cx', d => xScale(d.x1))
        .attr('cy', d => yScale(d.x2));

    // 计算准确率（简化）
    let correct = 0;
    data.forEach(d => {
        let prediction;
        if (model.type === 'linear') {
            prediction = (model.w.x1 * d.x1 + model.w.x2 * d.x2 + model.b) > 0 ? 1 : 0;
        } else {
            const d0 = Math.sqrt(Math.pow(d.x1 - model.center0.x1, 2) + Math.pow(d.x2 - model.center0.x2, 2));
            const d1 = Math.sqrt(Math.pow(d.x1 - model.center1.x1, 2) + Math.pow(d.x2 - model.center1.x2, 2));
            prediction = d1 < d0 ? 1 : 0;
        }
        if (prediction === d.label) correct++;
    });
    const accuracy = correct / data.length;
    document.getElementById('accuracy').textContent = (accuracy * 100).toFixed(1) + '%';
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    initVisualization();

    // C 滑块
    document.getElementById('c-slider').addEventListener('input', (e) => {
        C = parseFloat(e.target.value);
        document.getElementById('c-value').textContent = C.toFixed(2);
        renderVisualization();
    });

    // 核函数选择
    document.getElementById('kernel-select').addEventListener('change', (e) => {
        kernel = e.target.value;
        const gammaGroup = document.getElementById('gamma-group');
        gammaGroup.style.display = (kernel === 'rbf' || kernel === 'poly') ? 'flex' : 'none';
        supportVectors = [];
        renderVisualization();
    });

    // Gamma 滑块
    document.getElementById('gamma-slider').addEventListener('input', (e) => {
        gamma = parseFloat(e.target.value);
        document.getElementById('gamma-value').textContent = gamma.toFixed(1);
        renderVisualization();
    });

    // 生成新数据
    document.getElementById('generate-btn').addEventListener('click', () => {
        generateData();
        supportVectors = [];
        renderVisualization();
    });
});

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initVisualization, 300);
});
