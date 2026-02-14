// 多项式回归可视化

// D3.js 配置
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const vizWidth = 400;
const vizHeight = 320;

let data = [];
let degree = 2;
let alpha = 0;
let noiseLevel = 30;
let numPoints = 30;
let dataShape = 'quadratic';
let model = { weights: [] };
let mse = 0;
let r2Score = 0;

// 颜色
const colors = {
    data: '#3b82f6',
    line: '#10b981',
    true: '#6b7280',
    grid: '#374151'
};

// 生成多项式特征
function polynomialFeatures(x, degree) {
    const features = [1]; // 偏置项
    for (let d = 1; d <= degree; d++) {
        features.push(Math.pow(x, d));
    }
    return features;
}

// 构建设计矩阵
function buildDesignMatrix(X, degree) {
    return X.map(x => polynomialFeatures(x, degree));
}

// 岭回归求解
function ridgeRegression(X, y, alpha) {
    const n = X.length;
    const p = X[0].length;

    // X^T X + alpha*I
    const XtX = new Array(p).fill(0).map(() => new Array(p).fill(0));
    for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
            for (let k = 0; k < n; k++) {
                XtX[i][j] += X[k][i] * X[k][j];
            }
        }
        if (i > 0) { // 不正则化偏置项
            XtX[i][i] += alpha;
        }
    }

    // X^T y
    const Xty = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
        for (let k = 0; k < n; k++) {
            Xty[i] += X[k][i] * y[k];
        }
    }

    // 高斯消元
    const w = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
        let maxRow = i;
        for (let r = i + 1; r < p; r++) {
            if (Math.abs(XtX[r][i]) > Math.abs(XtX[maxRow][i])) {
                maxRow = r;
            }
        }
        [XtX[i], XtX[maxRow]] = [XtX[maxRow], XtX[i]];
        [Xty[i], Xty[maxRow]] = [Xty[maxRow], Xty[i]];

        for (let r = i + 1; r < p; r++) {
            const factor = XtX[r][i] / XtX[i][i];
            for (let c = i; c < p; c++) {
                XtX[r][c] -= factor * XtX[i][c];
            }
            Xty[r] -= factor * Xty[i];
        }
    }

    for (let i = p - 1; i >= 0; i--) {
        let sum = Xty[i];
        for (let j = i + 1; j < p; j++) {
            sum -= XtX[i][j] * w[j];
        }
        w[i] = sum / XtX[i][i];
    }

    return w;
}

// 预测
function predict(weights, x) {
    let y = 0;
    for (let d = 0; d < weights.length; d++) {
        y += weights[d] * Math.pow(x, d);
    }
    return y;
}

// 生成数据
function generateData() {
    const points = [];
    const xMin = 0, xMax = 10;

    for (let i = 0; i < numPoints; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        let y = 0;

        switch(dataShape) {
            case 'quadratic':
                y = 0.5 * x * x - 2 * x + 3;
                break;
            case 'cubic':
                y = 0.1 * x * x * x - 0.5 * x * x + x + 2;
                break;
            case 'sin':
                y = 3 * Math.sin(x) + 5;
                break;
            case 'exponential':
                y = Math.exp(0.3 * x);
                break;
        }

        y += (Math.random() - 0.5) * noiseLevel;
        points.push({ x, y });
    }

    return points;
}

// 计算真实函数值（用于绘制真实曲线）
function trueFunction(x) {
    switch(dataShape) {
        case 'quadratic':
            return 0.5 * x * x - 2 * x + 3;
        case 'cubic':
            return 0.1 * x * x * x - 0.5 * x * x + x + 2;
        case 'sin':
            return 3 * Math.sin(x) + 5;
        case 'exponential':
            return Math.exp(0.3 * x);
    }
}

// 计算 MSE 和 R²
function calculateMetrics(X, y, weights) {
    const yPred = X.map(xi => {
        let pred = 0;
        for (let j = 0; j < weights.length; j++) {
            pred += weights[j] * xi[j];
        }
        return pred;
    });

    let mse = 0;
    for (let i = 0; i < y.length; i++) {
        mse += (y[i] - yPred[i]) ** 2;
    }
    mse /= y.length;

    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < y.length; i++) {
        ssTot += (y[i] - yMean) ** 2;
        ssRes += (y[i] - yPred[i]) ** 2;
    }
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

    return { mse, r2 };
}

// 绘制主可视化
function drawMainViz() {
    const svg = d3.select("#main-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#main-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    const xExtent = [0, 10];
    const yExtent = d3.extent(data, d => d.y);
    yExtent[0] -= 5;
    yExtent[1] += 5;

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

    // 绘制真实曲线
    const trueLine = [];
    for (let x = 0; x <= 10; x += 0.1) {
        trueLine.push({ x, y: trueFunction(x) });
    }

    g.append("path")
        .datum(trueLine)
        .attr("fill", "none")
        .attr("stroke", colors.true)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y)));

    // 绘制拟合曲线
    const fitLine = [];
    for (let x = 0; x <= 10; x += 0.05) {
        fitLine.push({ x, y: predict(model.weights, x) });
    }

    g.append("path")
        .datum(fitLine)
        .attr("fill", "none")
        .attr("stroke", colors.line)
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y)));

    // 残差线
    data.forEach(p => {
        const pred = predict(model.weights, p.x);
        g.append("line")
            .attr("x1", xScale(p.x))
            .attr("y1", yScale(p.y))
            .attr("x2", xScale(p.x))
            .attr("y2", yScale(pred))
            .style("stroke", colors.line)
            .style("stroke-width", 1)
            .style("opacity", 0.3);
    });

    // 数据点
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

    // 图例
    const legend = g.append("g")
        .attr("transform", `translate(${width - 100}, 10)`);

    legend.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 25).attr("y2", 0)
        .style("stroke", colors.line)
        .style("stroke-width", 3);
    legend.append("text")
        .attr("x", 30).attr("y", 4)
        .style("font-size", "10px")
        .text("拟合曲线");

    legend.append("line")
        .attr("x1", 0).attr("y1", 16)
        .attr("x2", 25).attr("y2", 16)
        .style("stroke", colors.true)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");
    legend.append("text")
        .attr("x", 30).attr("y", 20)
        .style("font-size", "10px")
        .text("真实曲线");
}

// 绘制权重可视化
function drawWeightViz() {
    const svg = d3.select("#weight-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#weight-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", 200);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const maxAbs = Math.max(...model.weights.map(Math.abs)) * 1.2;
    const xScale = d3.scaleBand()
        .domain(model.weights.map((_, i) => i === 0 ? 'b' : `x^${i}`))
        .range([0, width])
        .padding(0.3);
    const yScale = d3.scaleLinear()
        .domain([-maxAbs, maxAbs])
        .range([height, 0]);

    // 零线
    g.append("line")
        .attr("x1", 0).attr("y1", yScale(0))
        .attr("x2", width).attr("y2", yScale(0))
        .style("stroke", colors.grid)
        .style("stroke-width", 1);

    // 权重柱
    model.weights.forEach((w, i) => {
        const x = xScale(i === 0 ? 'b' : `x^${i}`);
        const barHeight = Math.abs(yScale(w) - yScale(0));

        g.append("rect")
            .attr("x", x)
            .attr("y", yScale(Math.max(0, w)))
            .attr("width", xScale.bandwidth())
            .attr("height", barHeight)
            .style("fill", w >= 0 ? "#10b981" : "#ef4444")
            .style("opacity", 0.8);

        // 权重值标签
        g.append("text")
            .attr("x", x + xScale.bandwidth() / 2)
            .attr("y", yScale(w) + (w >= 0 ? -5 : 15))
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(w.toFixed(2));
    });

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale).ticks(5));
}

// 绘制不同次数的对比
function drawComparison() {
    const container = d3.select("#comparison-viz");
    container.selectAll("*").remove();

    const degrees = [1, 2, 3, 5, 10];
    const X = data.map(p => p.x);
    const y = data.map(p => p.y);

    const width = 380;
    const height = 180;
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear().domain([1, 10]).range([0, chartWidth]);
    const yScale = d3.scaleLinear().domain([0, Math.max(...y) * 1.2]).range([chartHeight, 0]);

    // 绘制每个次数的 MSE
    const mses = degrees.map(d => {
        const Phi = buildDesignMatrix(X, d);
        const w = ridgeRegression(Phi, y, alpha);
        const { mse } = calculateMetrics(Phi, y, w);
        return { degree: d, mse };
    });

    const line = d3.line()
        .x(d => xScale(d.degree))
        .y(d => yScale(d.mse))
        .curve(d3.curveMonotoneX);

    // MSE 曲线
    g.append("path")
        .datum(mses)
        .attr("fill", "none")
        .attr("stroke", colors.line)
        .attr("stroke-width", 2)
        .attr("d", line);

    // 数据点
    g.selectAll(".mse-point")
        .data(mses)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.degree))
        .attr("cy", d => yScale(d.mse))
        .attr("r", 5)
        .style("fill", d => d.degree === degree ? "#f59e0b" : colors.line)
        .style("stroke", "#fff")
        .style("stroke-width", 2);

    // 当前次数标记
    g.append("line")
        .attr("x1", xScale(degree)).attr("y1", 0)
        .attr("x2", xScale(degree)).attr("y2", chartHeight)
        .style("stroke", "#f59e0b")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "3,3");

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale));

    // 标签
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#6b7280")
        .text("多项式次数 → MSE");
}

// 更新模型
function updateModel() {
    const X = data.map(p => p.x);
    const y = data.map(p).y);
    const Phi = buildDesignMatrix(X, degree);

    model.weights = ridgeRegression(Phi, y, alpha);
    const metrics = calculateMetrics(Phi, y, model.weights);
    mse = metrics.mse;
    r2Score = metrics.r2;

    // 更新方程显示
    const equation = model.weights.map((w, i) => {
        if (i === 0) return `b=${w.toFixed(3)}`;
        const sign = w >= 0 ? '+' : '-';
        const absW = Math.abs(w).toFixed(3);
        return `${sign}${absW}·x^${i}`;
    }).join(' ');
    document.getElementById("equation").innerHTML = `<code style="font-size: 12px;">y = ${equation}</code>`;

    document.getElementById("mse").textContent = mse.toFixed(4);
    document.getElementById("r2-score").textContent = r2Score.toFixed(4);

    drawMainViz();
    drawWeightViz();
    drawComparison();
}

// 更新显示
function updateDisplay() {
    document.getElementById("degree-value").textContent = degree;
    document.getElementById("alpha-value").textContent = alpha.toFixed(2);
    document.getElementById("noise-value").textContent = noiseLevel;
    document.getElementById("num-points-value").textContent = numPoints;
}

// 初始化
function init() {
    document.getElementById("degree").addEventListener("input", e => {
        degree = parseInt(e.target.value);
        updateDisplay();
        updateModel();
    });

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

    document.getElementById("data-shape").addEventListener("change", e => {
        dataShape = e.target.value;
        data = generateData();
        updateModel();
    });

    document.getElementById("generate-btn").addEventListener("click", () => {
        data = generateData();
        updateModel();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        degree = 2;
        alpha = 0;
        noiseLevel = 30;
        numPoints = 30;
        dataShape = 'quadratic';
        document.getElementById("degree").value = degree;
        document.getElementById("alpha").value = alpha;
        document.getElementById("noise").value = noiseLevel;
        document.getElementById("num-points").value = numPoints;
        document.getElementById("data-shape").value = dataShape;
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
