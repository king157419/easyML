// Ridge 回归可视化

// D3.js 配置
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const mainWidth = 400;
const mainHeight = 350;
const weightWidth = 300;
const weightHeight = 200;

let data = [];
let alpha = 10;
let noiseLevel = 20;
let numPoints = 30;
let model = { w: 0, b: 0 };
let r2Score = 0;
let weightHistory = []; // Track weight changes

// 颜色
const colors = {
    data: '#3b82f6',
    line: '#10b981',
    ridge: '#f59e0b',
    background: '#1f2937',
    grid: '#374151'
};

// 生成数据：y = 2x + 10 + noise
function generateData() {
    const points = [];
    const trueW = 2;
    const trueB = 10;

    for (let i = 0; i < numPoints; i++) {
        const x = 50 + Math.random() * 300;
        const noise = (Math.random() - 0.5) * noiseLevel;
        points.push({
            x: x,
            y: trueW * (x / 50) + trueB + noise
        });
    }
    return points;
}

// Ridge 回归：使用解析解
function ridgeRegression(X, y, alpha) {
    const n = X.length;
    const p = X[0].length; // 特征数

    // X^T X
    const XtX = new Array(p).fill(0).map(() => new Array(p).fill(0));
    for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
            for (let k = 0; k < n; k++) {
                XtX[i][j] += X[k][i] * X[k][j];
            }
        }
    }

    // 添加 alpha * I
    for (let i = 0; i < p; i++) {
        XtX[i][i] += alpha;
    }

    // X^T y
    const Xty = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
        for (let k = 0; k < n; k++) {
            Xty[i] += X[k][i] * y[k];
        }
    }

    // 求解 (X^T X + alpha I)^(-1) X^T y
    // 对于 2x2 矩阵，可以用公式求解
    const det = XtX[0][0] * XtX[1][1] - XtX[0][1] * XtX[1][0];
    if (Math.abs(det) < 1e-10) {
        return { w: 0, b: 0 };
    }

    const inv = [
        [XtX[1][1] / det, -XtX[0][1] / det],
        [-XtX[1][0] / det, XtX[0][0] / det]
    ];

    const w = inv[0][0] * Xty[0] + inv[0][1] * Xty[1];
    const b = inv[1][0] * Xty[0] + inv[1][1] * Xty[1];

    return { w, b };
}

// 普通 OLS 回归（alpha = 0）
function olsRegression(X, y) {
    return ridgeRegression(X, y, 0);
}

// 计算 R²
function calculateR2(X, y, w, b) {
    const yPred = X.map(xi => w * xi[0] + b);
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;

    let ssRes = 0; // 残差平方和
    let ssTot = 0; // 总平方和
    for (let i = 0; i < y.length; i++) {
        ssRes += (y[i] - yPred[i]) ** 2;
        ssTot += (y[i] - yMean) ** 2;
    }

    return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

// 计算预测线
function predict(w, b, xMin, xMax, numPoints = 100) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const x = xMin + (xMax - xMin) * i / (numPoints - 1);
        const y = w * x + b;
        points.push({ x, y });
    }
    return points;
}

// 计算损失
function calculateLoss(w, b) {
    // MSE
    let mse = 0;
    data.forEach(p => {
        const pred = w * (p.x / 50) + b;
        mse += (p.y - pred) ** 2;
    });
    mse /= data.length;

    // L2 惩罚
    const l2 = alpha * w * w;

    return { mse, l2, total: mse + l2 };
}

// 绘制主可视化
function drawMainViz() {
    const svg = d3.select("#main-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#main-viz")
        .append("svg")
        .attr("width", mainWidth)
        .attr("height", mainHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = mainWidth - margin.left - margin.right;
    const height = mainHeight - margin.top - margin.bottom;

    // X 和 Y 范围
    const xExtent = [40, 360];
    const yExtent = d3.extent(data, d => d.y);
    yExtent[0] -= 10;
    yExtent[1] += 10;

    const xScale = d3.scaleLinear().domain(xExtent).range([0, width]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height, 0]);

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

    // 绘制 Ridge 回归线
    const ridgeLine = predict(model.w, model.b, xExtent[0], xExtent[1]);
    g.append("path")
        .datum(ridgeLine)
        .attr("fill", "none")
        .attr("stroke", colors.ridge)
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y)));

    // 绘制 OLS 回归线（虚线，alpha = 0）
    const olsModel = olsRegression(
        data.map(p => [p.x / 50, 1]),
        data.map(p => p.y)
    );
    const olsLine = predict(olsModel.w, olsModel.b, xExtent[0], xExtent[1]);
    g.append("path")
        .datum(olsLine)
        .attr("fill", "none")
        .attr("stroke", colors.line)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", d3.line()
            .x(d => xScale(d.x / 50))
            .y(d => yScale(d.y)));

    // 绘制数据点
    g.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .style("fill", colors.data)
        .style("opacity", 0.7)
        .style("stroke", "#fff")
        .style("stroke-width", 1);

    // 残差线
    data.forEach(p => {
        const pred = model.w * (p.x / 50) + model.b;
        g.append("line")
            .attr("x1", xScale(p.x))
            .attr("y1", yScale(p.y))
            .attr("x2", xScale(p.x))
            .attr("y2", yScale(pred))
            .style("stroke", colors.ridge)
            .style("stroke-width", 1)
            .style("opacity", 0.3);
    });

    // 图例
    const legend = g.append("g")
        .attr("transform", `translate(${width - 100}, 10)`);

    legend.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 30).attr("y2", 0)
        .style("stroke", colors.ridge)
        .style("stroke-width", 3);
    legend.append("text")
        .attr("x", 35).attr("y", 4)
        .style("font-size", "11px")
        .text(`Ridge (α=${alpha})`);

    legend.append("line")
        .attr("x1", 0).attr("y1", 20)
        .attr("x2", 30).attr("y2", 20)
        .style("stroke", colors.line)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");
    legend.append("text")
        .attr("x", 35).attr("y", 24)
        .style("font-size", "11px")
        .text("OLS (α=0)");
}

// 绘制权重变化可视化
function drawWeightViz() {
    const svg = d3.select("#weight-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#weight-viz")
        .append("svg")
        .attr("width", weightWidth)
        .attr("height", weightHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = weightWidth - margin.left - margin.right;
    const height = weightHeight - margin.top - margin.bottom;

    // 计算不同 alpha 值下的权重
    const alphas = [0, 1, 5, 10, 20, 50, 100];
    const weights = alphas.map(a => {
        const m = ridgeRegression(
            data.map(p => [p.x / 50, 1]),
            data.map(p => p.y),
            a
        );
        return { alpha: a, w: m.w };
    });

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(alphas)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(weights, w => Math.abs(w.w)) * 1.2])
        .range([height, 0]);

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d => d));

    g.append("g")
        .call(d3.axisLeft(yScale));

    // 标签
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("α (正则化强度)");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("|权重|");

    // 绘制权重曲线
    const line = d3.line()
        .x(d => xScale(d.alpha))
        .y(d => yScale(Math.abs(d.w)))
        .curve(d3.curveMonotoneX);

    g.append("path")
        .datum(weights)
        .attr("fill", "none")
        .attr("stroke", colors.ridge)
        .attr("stroke-width", 2)
        .attr("d", line);

    // 绘制当前 alpha 位置
    const currentW = weights.find(w => w.alpha === alpha);
    g.append("circle")
        .attr("cx", xScale(alpha))
        .attr("cy", yScale(Math.abs(currentW.w)))
        .attr("r", 6)
        .style("fill", colors.ridge)
        .style("stroke", "#fff")
        .style("stroke-width", 2);
}

// 更新模型
function updateModel() {
    const X = data.map(p => [p.x / 50, 1]);
    const y = data.map(p => p.y);

    model = ridgeRegression(X, y, alpha);
    r2Score = calculateR2(X, y, model.w, model.b);

    // 更新显示
    document.getElementById("slope").textContent = model.w.toFixed(4);
    document.getElementById("intercept").textContent = model.b.toFixed(4);
    document.getElementById("r2-score").textContent = r2Score.toFixed(4);

    const loss = calculateLoss(model.w, model.b);
    document.getElementById("l2-penalty").textContent = loss.l2.toFixed(4);

    drawMainViz();
    drawWeightViz();
}

// 更新显示
function updateDisplay() {
    document.getElementById("alpha-value").textContent = alpha;
    document.getElementById("noise-value").textContent = noiseLevel;
    document.getElementById("num-points-value").textContent = numPoints;
}

// 初始化
function init() {
    document.getElementById("alpha").addEventListener("input", e => {
        alpha = parseFloat(e.target.value);
        updateDisplay();
        updateModel();
    });

    document.getElementById("noise").addEventListener("input", e => {
        noiseLevel = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("num-points").addEventListener("input", e => {
        numPoints = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("generate-btn").addEventListener("click", () => {
        data = generateData();
        updateModel();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        alpha = 10;
        noiseLevel = 20;
        numPoints = 30;
        document.getElementById("alpha").value = alpha;
        document.getElementById("noise").value = noiseLevel;
        document.getElementById("num-points").value = numPoints;
        updateDisplay();
        data = generateData();
        updateModel();
    });

    // 初始数据
    data = generateData();
    updateDisplay();
    updateModel();
}

document.addEventListener("DOMContentLoaded", init);
