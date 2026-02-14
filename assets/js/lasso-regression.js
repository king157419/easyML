// Lasso 回归可视化

// D3.js 配置
const margin = {top: 20, right: 20, bottom: 40, left: 50};
const vizWidth = 350;
const vizHeight = 280;

let data = [];
let trueWeights = [];
let alpha = 1;
let numFeatures = 3;
let noiseLevel = 20;
let model = { weights: [], intercept: 0 };
let r2Score = 0;

// 颜色
const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// 生成数据：使用线性组合特征
function generateData() {
    const n = 50;
    const points = [];

    // 真实权重（只有前2个特征重要）
    trueWeights = [2.5, 1.5, 0, 0, 0].slice(0, numFeatures);
    const trueIntercept = 10;

    // 生成特征（标准化）
    const features = [];
    for (let i = 0; i < n; i++) {
        const feat = [];
        for (let j = 0; j < numFeatures; j++) {
            feat.push((Math.random() - 0.5) * 2);
        }
        features.push(feat);

        // 计算目标值
        let y = trueIntercept;
        for (let j = 0; j < numFeatures; j++) {
            y += trueWeights[j] * feat[j];
        }
        y += (Math.random() - 0.5) * noiseLevel;

        points.push({
            features: feat,
            y: y,
            index: i
        });
    }

    return points;
}

// 软阈值函数（Lasso 的核心）
function softThreshold(z, alpha) {
    if (z > alpha) return z - alpha;
    if (z < -alpha) return z + alpha;
    return 0;
}

// Lasso 回归：坐标下降算法
function lassoRegression(X, y, alpha, maxIter = 1000, tol = 1e-6) {
    const n = X.length;
    const p = X[0].length;

    // 初始化权重
    let w = new Array(p).fill(0);
    let b = 0;

    // 预计算特征平方和
    const sumSquares = new Array(p).fill(0);
    for (let j = 0; j < p; j++) {
        for (let i = 0; i < n; i++) {
            sumSquares[j] += X[i][j] * X[i][j];
        }
    }

    // 坐标下降
    for (let iter = 0; iter < maxIter; iter++) {
        let maxChange = 0;

        // 更新截距
        let residual = 0;
        for (let i = 0; i < n; i++) {
            let pred = b;
            for (let j = 0; j < p; j++) {
                pred += w[j] * X[i][j];
            }
            residual += y[i] - pred;
        }
        const newB = b + residual / n;
        maxChange = Math.max(maxChange, Math.abs(newB - b));
        b = newB;

        // 更新每个权重
        for (let j = 0; j < p; j++) {
            // 计算 rho_j = sum(x_ij * (y_i - pred_without_j))
            let rho = 0;
            for (let i = 0; i < n; i++) {
                let pred = b;
                for (let k = 0; k < p; k++) {
                    if (k !== j) {
                        pred += w[k] * X[i][k];
                    }
                }
                rho += X[i][j] * (y[i] - pred);
            }

            // 软阈值
            const newW = softThreshold(rho, alpha) / sumSquares[j];
            maxChange = Math.max(maxChange, Math.abs(newW - w[j]));
            w[j] = newW;
        }

        if (maxChange < tol) break;
    }

    return { weights: w, intercept: b };
}

// Ridge 回归（用于对比）
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
        XtX[i][i] += alpha;
    }

    // X^T y
    const Xty = new Array(p).fill(0);
    for (let i = 0; i < p; i++) {
        for (let k = 0; k < n; k++) {
            Xty[i] += X[k][i] * y[k];
        }
    }

    // 对于小矩阵，使用简单的高斯消元
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

    // 计算截距
    let b = 0;
    for (let i = 0; i < n; i++) {
        let pred = 0;
        for (let j = 0; j < p; j++) {
            pred += w[j] * X[i][j];
        }
        b += y[i] - pred;
    }
    b /= n;

    return { weights: w, intercept: b };
}

// 计算 R²
function calculateR2(X, y, weights, intercept) {
    const yPred = X.map(xi => {
        let pred = intercept;
        for (let j = 0; j < weights.length; j++) {
            pred += weights[j] * xi[j];
        }
        return pred;
    });
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;

    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < y.length; i++) {
        ssRes += (y[i] - yPred[i]) ** 2;
        ssTot += (y[i] - yMean) ** 2;
    }

    return ssTot === 0 ? 1 : 1 - ssRes / ssTot;
}

// 绘制预测可视化
function drawPredViz() {
    const svg = d3.select("#pred-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#pred-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    // 预测值 vs 真实值
    const X = data.map(p => p.features);
    const y = data.map(p => p.y);

    const yPred = X.map(xi => {
        let pred = model.intercept;
        for (let j = 0; j < model.weights.length; j++) {
            pred += model.weights[j] * xi[j];
        }
        return pred;
    });

    const plotData = data.map((p, i) => ({
        actual: p.y,
        predicted: yPred[i]
    }));

    const yExtent = d3.extent([...plotData.map(d => d.actual), ...plotData.map(d => d.predicted)]);
    const xScale = d3.scaleLinear().domain(yExtent).range([0, width]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height, 0]);

    // 对角线（完美预测）
    g.append("line")
        .attr("x1", 0).attr("y1", height)
        .attr("x2", width).attr("y2", 0)
        .style("stroke", "#374151")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "5,5");

    // 数据点
    g.selectAll(".point")
        .data(plotData)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d.actual))
        .attr("cy", d => yScale(d.predicted))
        .attr("r", 5)
        .style("fill", "#3b82f6")
        .style("opacity", 0.6)
        .style("stroke", "#fff")
        .style("stroke-width", 1);

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale));

    // 标签
    svgElem.append("text")
        .attr("x", vizWidth / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("fill", "#6b7280")
        .text("真实值");
}

// 绘制权重可视化
function drawWeightViz() {
    const svg = d3.select("#weight-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#weight-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    const maxWeight = Math.max(
        ...model.weights.map(Math.abs),
        ...trueWeights.map(Math.abs)
    ) * 1.1;

    const xScale = d3.scaleBand()
        .domain(model.weights.map((_, i) => `特征${i + 1}`))
        .range([0, width])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([-maxWeight, maxWeight])
        .range([height, 0]);

    // 零线
    const zeroY = yScale(0);
    g.append("line")
        .attr("x1", 0).attr("y1", zeroY)
        .attr("x2", width).attr("y2", zeroY)
        .style("stroke", "#374151")
        .style("stroke-width", 1);

    // 真实权重柱（浅色背景）
    model.weights.forEach((_, i) => {
        const x = xScale(`特征${i + 1}`);
        const barWidth = xScale.bandwidth() / 2;

        g.append("rect")
            .attr("x", x)
            .attr("y", yScale(Math.max(0, trueWeights[i])))
            .attr("width", barWidth)
            .attr("height", Math.abs(yScale(trueWeights[i]) - yScale(0)))
            .style("fill", colors[i % colors.length])
            .style("opacity", 0.3);
    });

    // Lasso 权重柱（前景）
    model.weights.forEach((w, i) => {
        const x = xScale(`特征${i + 1}`);
        const barWidth = xScale.bandwidth() / 2;
        const y = yScale(Math.max(0, w));
        const h = Math.abs(yScale(w) - yScale(0));

        g.append("rect")
            .attr("x", x + barWidth * 0.1)
            .attr("y", y)
            .attr("width", barWidth * 0.8)
            .attr("height", h)
            .style("fill", colors[i % colors.length])
            .style("opacity", w === 0 ? 0.3 : 1);
    });

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .call(d3.axisLeft(yScale));

    // 图例
    const legend = g.append("g")
        .attr("transform", `translate(${width - 100}, 10)`);

    legend.append("rect")
        .attr("width", 12).attr("height", 12)
        .style("fill", colors[0])
        .style("opacity", 0.3);
    legend.append("text")
        .attr("x", 16).attr("y", 10)
        .style("font-size", "10px")
        .text("真实权重");

    legend.append("rect")
        .attr("y", 16)
        .attr("width", 12).attr("height", 12)
        .style("fill", colors[0])
        .style("opacity", 1);
    legend.append("text")
        .attr("x", 16).attr("y", 26)
        .style("font-size", "10px")
        .text("Lasso 权重");
}

// 绘制 L1 vs L2 对比
function drawComparison() {
    const container = d3.select("#comparison-viz");
    container.selectAll("*").remove();

    const X = data.map(p => p.features);
    const y = data.map(p => p.y);

    const alphas = [0, 0.1, 0.5, 1, 2, 5, 10];
    const lassoWeights = alphas.map(a => {
        const m = lassoRegression(X, y, a);
        return { alpha: a, weights: [...m.weights] };
    });
    const ridgeWeights = alphas.map(a => {
        const m = ridgeRegression(X, y, a);
        return { alpha: a, weights: [...m.weights] };
    });

    const width = 350;
    const height = 200;
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(alphas)])
        .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
        .domain([-3, 3])
        .range([chartHeight, 0]);

    // 零线
    g.append("line")
        .attr("x1", 0).attr("y1", yScale(0))
        .attr("x2", chartWidth).attr("y2", yScale(0))
        .style("stroke", "#374151")
        .style("stroke-width", 1);

    // 绘制每条特征的权重曲线
    for (let feat = 0; feat < numFeatures; feat++) {
        const lassoLine = d3.line()
            .x(d => xScale(d.alpha))
            .y(d => yScale(d.weights[feat]))
            .curve(d3.curveMonotoneX);

        g.append("path")
            .datum(lassoWeights)
            .attr("fill", "none")
            .attr("stroke", colors[feat % colors.length])
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "3,3")
            .attr("d", lassoLine);

        const ridgeLine = d3.line()
            .x(d => xScale(d.alpha))
            .y(d => yScale(d.weights[feat]))
            .curve(d3.curveMonotoneX);

        g.append("path")
            .datum(ridgeWeights)
            .attr("fill", "none")
            .attr("stroke", colors[feat % colors.length])
            .attr("stroke-width", 2)
            .attr("opacity", 0.5)
            .attr("d", ridgeLine);
    }

    // 当前 alpha 位置标记
    g.append("line")
        .attr("x1", xScale(alpha)).attr("y1", 0)
        .attr("x2", xScale(alpha)).attr("y2", chartHeight)
        .style("stroke", "#f59e0b")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5");

    // 坐标轴
    g.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format(".1f")));

    g.append("g")
        .call(d3.axisLeft(yScale));

    // 图例
    const legend = g.append("g")
        .attr("transform", `translate(${chartWidth - 120}, 10)`);

    legend.append("line")
        .attr("x2", 30)
        .style("stroke", "#3b82f6")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "3,3");
    legend.append("text")
        .attr("x", 35).attr("y", 4)
        .style("font-size", "10px")
        .text("Lasso (L1)");

    legend.append("line")
        .attr("y", 16).attr("x2", 30)
        .style("stroke", "#3b82f6")
        .style("stroke-width", 2)
        .style("opacity", 0.5);
    legend.append("text")
        .attr("x", 35).attr("y", 20)
        .style("font-size", "10px")
        .text("Ridge (L2)");
}

// 更新模型
function updateModel() {
    const X = data.map(p => p.features);
    const y = data.map(p => p.y);

    model = lassoRegression(X, y, alpha);
    r2Score = calculateR2(X, y, model.weights, model.intercept);

    // 更新权重信息显示
    const weightsInfo = document.getElementById("weights-info");
    weightsInfo.innerHTML = model.weights.map((w, i) => {
        const trueW = trueWeights[i];
        const color = w === 0 ? "#ef4444" : "#10b981";
        return `<p>特征${i + 1}: <span style="color: ${color}">${w.toFixed(4)}</span> (真实: ${trueW.toFixed(2)})</p>`;
    }).join('');

    document.getElementById("r2-score").textContent = r2Score.toFixed(4);
    document.getElementById("nonzero-count").textContent = model.weights.filter(w => Math.abs(w) > 1e-6).length;

    drawPredViz();
    drawWeightViz();
    drawComparison();
}

// 更新显示
function updateDisplay() {
    document.getElementById("alpha-value").textContent = alpha.toFixed(1);
    document.getElementById("num-features-value").textContent = numFeatures;
    document.getElementById("noise-value").textContent = noiseLevel;
}

// 初始化
function init() {
    document.getElementById("alpha").addEventListener("input", e => {
        alpha = parseFloat(e.target.value);
        updateDisplay();
        updateModel();
    });

    document.getElementById("num-features").addEventListener("input", e => {
        numFeatures = parseInt(e.target.value);
        updateDisplay();
        data = generateData();
        updateModel();
    });

    document.getElementById("noise").addEventListener("input", e => {
        noiseLevel = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("generate-btn").addEventListener("click", () => {
        data = generateData();
        updateModel();
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        alpha = 1;
        numFeatures = 3;
        noiseLevel = 20;
        document.getElementById("alpha").value = alpha;
        document.getElementById("num-features").value = numFeatures;
        document.getElementById("noise").value = noiseLevel;
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
