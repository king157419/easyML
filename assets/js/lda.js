// LDA 线性判别分析可视化

// D3.js 配置
const margin = {top: 20, right: 30, bottom: 30, left: 40};
const vizWidth = 380;
const vizHeight = 300;

let data = [];
let projection = { slope: 0, intercept: 0 };
let showMode = 'both';

// 颜色
const colors = {
    class0: '#ef4444',
    class1: '#3b82f6',
    line: '#10b981'
};

// 生成数据
function generateData(type) {
    const points = [];
    let class0Mean, class1Mean, class0Std, class1Std;

    switch(type) {
        case 'separable':
            class0Mean = [0.3, 0.3];
            class1Mean = [0.7, 0.7];
            class0Std = 0.1;
            class1Std = 0.1;
            break;
        case 'overlapping':
            class0Mean = [0.4, 0.5];
            class1Mean = [0.6, 0.5];
            class0Std = 0.12;
            class1Std = 0.12;
            break;
        case 'diagonal':
            class0Mean = [0.35, 0.65];
            class1Mean = [0.65, 0.35];
            class0Std = 0.1;
            class1Std = 0.1;
            break;
    }

    // 生成类别 0
    for (let i = 0; i < 40; i++) {
        points.push({
            x: class0Mean[0] + (Math.random() - 0.5) * class0Std * 2,
            y: class0Mean[1] + (Math.random() - 0.5) * class0Std * 2,
            label: 0
        });
    }

    // 生成类别 1
    for (let i = 0; i < 40; i++) {
        points.push({
            x: class1Mean[0] + (Math.random() - 0.5) * class1Std * 2,
            y: class1Mean[1] + (Math.random() - 0.5) * class1Std * 2,
            label: 1
        });
    }

    return points;
}

// LDA 算法
function computeLDA(points) {
    // 计算类别均值
    const class0Points = points.filter(p => p.label === 0);
    const class1Points = points.filter(p => p.label === 1);

    const mu0 = {
        x: class0Points.reduce((s, p) => s + p.x, 0) / class0Points.length,
        y: class0Points.reduce((s, p) => s + p.y, 0) / class0Points.length
    };

    const mu1 = {
        x: class1Points.reduce((s, p) => s + p.x, 0) / class1Points.length,
        y: class1Points.reduce((s, p) => s + p.y, 0) / class1Points.length
    };

    // 计算类内散度矩阵
    function computeScatter(points, mean) {
        let scatter = [[0, 0], [0, 0]];
        points.forEach(p => {
            const dx = p.x - mean.x;
            const dy = p.y - mean.y;
            scatter[0][0] += dx * dx;
            scatter[0][1] += dx * dy;
            scatter[1][0] += dy * dx;
            scatter[1][1] += dy * dy;
        });
        return scatter;
    }

    const S0 = computeScatter(class0Points, mu0);
    const S1 = computeScatter(class1Points, mu1);

    const Sw = [[S0[0][0] + S1[0][0], S0[0][1] + S1[0][1]],
                [S0[1][0] + S1[1][0], S0[1][1] + S1[1][1]]];

    // 类间散度
    const meanDiff = { x: mu1.x - mu0.x, y: mu1.y - mu0.y };
    const Sb = [[meanDiff.x * meanDiff.x, meanDiff.x * meanDiff.y],
                [meanDiff.y * meanDiff.x, meanDiff.y * meanDiff.y]];

    // 求解 Sw^(-1) * (mu1 - mu0)
    const det = Sw[0][0] * Sw[1][1] - Sw[0][1] * Sw[1][0];
    const invSw = [[Sw[1][1] / det, -Sw[0][1] / det],
                   [-Sw[1][0] / det, Sw[0][0] / det]];

    const w = {
        x: invSw[0][0] * meanDiff.x + invSw[0][1] * meanDiff.y,
        y: invSw[1][0] * meanDiff.x + invSw[1][1] * meanDiff.y
    };

    // 计算投影方向（归一化）
    const norm = Math.sqrt(w.x * w.x + w.y * w.y);
    w.x /= norm;
    w.y /= norm;

    // 计算类间和类内方差
    let betweenVar = 0, withinVar = 0;

    class0Points.forEach(p => {
        const proj = p.x * w.x + p.y * w.y;
        const meanProj = mu0.x * w.x + mu0.y * w.y;
        withinVar += (proj - meanProj) ** 2;
    });

    class1Points.forEach(p => {
        const proj = p.x * w.x + p.y * w.y;
        const meanProj = mu1.x * w.x + mu1.y * w.y;
        withinVar += (proj - meanProj) ** 2;
    });

    betweenVar = (mu0.x * w.x + mu0.y * w.y - mu1.x * w.x - mu1.y * w.y) ** 2;

    // 计算分类阈值（中点）
    const thresholdProj = (mu0.x * w.x + mu0.y * w.y + mu1.x * w.x + mu1.y * w.y) / 2;

    // 计算准确率
    let correct = 0;
    points.forEach(p => {
        const proj = p.x * w.x + p.y * w.y;
        const predicted = proj > thresholdProj ? 1 : 0;
        if (predicted === p.label) correct++;
    });
    const accuracy = correct / points.length;

    return {
        direction: w,
        betweenVar,
        withinVar,
        threshold: thresholdProj,
        accuracy
    };
}

// 投影数据点到 1D
function projectData(points, direction) {
    return points.map(p => ({
        projection: p.x * direction.x + p.y * direction.y,
        label: p.label
    }));
}

// 绘制原始 2D 数据
function drawOriginalViz() {
    const svg = d3.select("#original-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#original-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    // 网格
    g.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat(""));

    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""));

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale));

    // 绘制 LDA 投影方向
    const centerX = width / 2;
    const centerY = height / 2;
    const lineLength = Math.min(width, height) * 0.4;

    g.append("line")
        .attr("x1", centerX - projection.direction.x * lineLength)
        .attr("y1", centerY - projection.direction.y * lineLength)
        .attr("x2", centerX + projection.direction.x * lineLength)
        .attr("y2", centerY + projection.direction.y * lineLength)
        .style("stroke", colors.line)
        .style("stroke-width", 3);

    // 绘制决策边界（垂直于投影方向）
    const perpX = -projection.direction.y;
    const perpY = projection.direction.x;
    g.append("line")
        .attr("x1", centerX - perpX * lineLength * 0.5)
        .attr("y1", centerY - perpY * lineLength * 0.5)
        .attr("x2", centerX + perpX * lineLength * 0.5)
        .attr("y2", centerY + perpY * lineLength * 0.5)
        .style("stroke", "#6b7280")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");

    // 数据点
    g.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .style("fill", d => d.label === 0 ? colors.class0 : colors.class1)
        .style("opacity", 0.7)
        .style("stroke", "#fff")
        .style("stroke-width", 1);
}

// 绘制投影后的 1D 数据
function drawProjectedViz() {
    const svg = d3.select("#projected-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#projected-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    // 计算投影值
    const projected = projectData(data, projection.direction);

    // 找到投影值范围
    const allProjs = projected.map(p => p.projection);
    const minProj = Math.min(...allProjs);
    const maxProj = Math.max(...allProjs);
    const padding = (maxProj - minProj) * 0.1;

    const xScale = d3.scaleLinear()
        .domain([minProj - padding, maxProj + padding])
        .range([0, width]);

    // 绘制 1D 轴
    g.append("line")
        .attr("x1", 0).attr("y1", height / 2)
        .attr("x2", width).attr("y2", height / 2)
        .style("stroke", "#374151")
        .style("stroke-width", 2);

    // 绘制阈值线
    const thresholdX = xScale(projection.threshold);
    g.append("line")
        .attr("x1", thresholdX).attr("y1", height / 2 - 40)
        .attr("x2", thresholdX).attr("y2", height / 2 + 40)
        .style("stroke", "#f59e0b")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");

    g.append("text")
        .attr("x", thresholdX).attr("y", height / 2 - 45)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#f59e0b")
        .text("阈值");

    // 绘制投影点
    projected.forEach(p => {
        const cx = xScale(p.projection);

        // 点
        g.append("circle")
            .attr("cx", cx)
            .attr("cy", height / 2)
            .attr("r", 6)
            .style("fill", p.label === 0 ? colors.class0 : colors.class1)
            .style("stroke", "#fff")
            .style("stroke-width", 2);

        // 连线（显示垂直投影）
        g.append("line")
            .attr("x1", cx).attr("y1", height / 2 - 15)
            .attr("x2", cx).attr("y2", height / 2 + 15)
            .style("stroke", p.label === 0 ? colors.class0 : colors.class1)
            .style("stroke-width", 1)
            .style("opacity", 0.3);
    });

    // 类别标签
    g.append("text")
        .attr("x", 20).attr("y", 20)
        .style("font-size", "12px")
        .style("fill", colors.class0)
        .text("类别 0");

    g.append("text")
        .attr("x", width - 20).attr("y", 20)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", colors.class1)
        .text("类别 1");
}

// 更新统计信息
function updateStats() {
    document.getElementById("projection-direction").textContent =
        `(${projection.direction.x.toFixed(3)}, ${projection.direction.y.toFixed(3)})`;

    const ratio = projection.withinVar > 0 ?
        (projection.betweenVar / projection.withinVar).toFixed(4) : "∞";
    document.getElementById("variance-ratio").textContent = ratio;

    document.getElementById("accuracy").textContent =
        (projection.accuracy * 100).toFixed(2) + "%";
}

// 更新可视化
function updateVisualization() {
    const result = computeLDA(data);
    projection.direction = result.direction;
    projection.betweenVar = result.betweenVar;
    projection.withinVar = result.withinVar;
    projection.threshold = result.threshold;
    projection.accuracy = result.accuracy;

    if (showMode === 'both' || showMode === 'original') {
        drawOriginalViz();
    }

    if (showMode === 'both' || showMode === 'projected') {
        drawProjectedViz();
    }

    updateStats();
}

// 初始化
function init() {
    document.getElementById("dataset-select").addEventListener("change", e => {
        data = generateData(e.target.value);
        updateVisualization();
    });

    document.getElementById("show-select").addEventListener("change", e => {
        showMode = e.target.value;
        updateVisualization();
    });

    document.getElementById("generate-btn").addEventListener("click", () => {
        const type = document.getElementById("dataset-select").value;
        data = generateData(type);
        updateVisualization();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        document.getElementById("dataset-select").value = 'separable';
        document.getElementById("show-select").value = 'both';
        showMode = 'both';
        data = generateData('separable');
        updateVisualization();
    });

    // 初始数据
    data = generateData('separable');
    showMode = 'both';
    updateVisualization();
}

document.addEventListener("DOMContentLoaded", init);
