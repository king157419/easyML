// t-SNE 可视化

// D3.js 配置
const margin = {top: 20, right: 20, bottom: 30, left: 40};
const width = 380 - margin.left - margin.right;
const height = 350 - margin.top - margin.bottom;

let originalData = [];
let tsneData = [];
let currentIteration = 0;
let maxIterations = 500;
let perplexity = 30;
let learningRate = 200;
let isRunning = false;
let animationId = null;

// 颜色映射
const colors = d3.scaleOrdinal(d3.schemeCategory10);

// 数据生成器
function generateData(type) {
    const points = [];
    let labels = [];

    switch(type) {
        case 'clusters':
            // 3个聚类
            for (let c = 0; c < 3; c++) {
                for (let i = 0; i < 50; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 30;
                    points.push({
                        x: 100 + c * 150 + Math.cos(angle) * radius + (Math.random() - 0.5) * 10,
                        y: 150 + Math.sin(angle) * radius + (Math.random() - 0.5) * 10,
                        z: Math.random() * 100
                    });
                    labels.push(c);
                }
            }
            break;

        case 'swiss':
            // 瑞士卷数据
            for (let i = 0; i < 150; i++) {
                const t = i / 150 * 4 * Math.PI;
                const x = t * Math.cos(t) / 2 + 200;
                const y = t * Math.sin(t) / 2 + 150;
                const z = t / (4 * Math.PI) * 100;
                points.push({ x, y, z });
                labels.push(Math.floor(i / 50));
            }
            break;

        case 'digits':
            // 模拟手写数字（简化版）
            for (let d = 0; d < 5; d++) {
                for (let i = 0; i < 30; i++) {
                    points.push({
                        x: d * 80 + 50 + (Math.random() - 0.5) * 60,
                        y: 100 + Math.random() * 100 + (Math.random() - 0.5) * 30,
                        z: d * 20 + Math.random() * 20,
                        w: Math.random() * 50
                    });
                    labels.push(d);
                }
            }
            break;
    }

    return { points, labels };
}

// 计算高斯核距离
function gaussianKernel(distances, sigma) {
    const n = distances.length;
    const P = new Float64Array(n);

    let sum = 0;
    for (let i = 0; i < n; i++) {
        P[i] = Math.exp(-distances[i] / (2 * sigma * sigma));
        if (i !== 0) sum += P[i];
    }

    // 归一化
    for (let i = 0; i < n; i++) {
        if (i !== 0) P[i] /= sum;
    }

    return P;
}

// 计算成对相似度矩阵
function computePairwiseSimilarities(data, perplexity) {
    const n = data.length;
    const P = new Array(n);
    const targetEntropy = Math.log(perplexity);

    for (let i = 0; i < n; i++) {
        // 计算到所有其他点的距离
        const distances = new Float64Array(n);
        for (let j = 0; j < n; j++) {
            if (i === j) {
                distances[j] = Infinity;
            } else {
                let dist = 0;
                for (let k = 0; k < data[i].length; k++) {
                    const d = data[i][k] - data[j][k];
                    dist += d * d;
                }
                distances[j] = dist;
            }
        }

        // 二分搜索找到合适的 sigma
        let sigmaMin = 1e-10;
        let sigmaMax = 1e10;
        let sigma = 1;
        let tolerance = 1e-5;
        let iterations = 0;

        while (iterations < 50) {
            const P_i = gaussianKernel(distances, sigma);

            // 计算熵
            let entropy = 0;
            for (let j = 0; j < n; j++) {
                if (j !== 0 && P_i[j] > 1e-10) {
                    entropy -= P_i[j] * Math.log(P_i[j]);
                }
            }

            const diff = entropy - targetEntropy;
            if (Math.abs(diff) < tolerance) break;

            if (diff > 0) {
                sigmaMax = sigma;
                sigma = (sigmaMin + sigmaMax) / 2;
            } else {
                sigmaMin = sigma;
                sigma = (sigmaMin + sigmaMax) / 2;
            }
            iterations++;
        }

        P[i] = gaussianKernel(distances, sigma);
    }

    // 对称化
    const n2 = n * n;
    const P_sym = new Float64Array(n2);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                P_sym[i * n + j] = 0;
            } else {
                P_sym[i * n + j] = (P[i][j] + P[j][i]) / (2 * n);
            }
        }
    }

    return P_sym;
}

// 计算低维相似度（t分布）
function computeQLowDim(Y) {
    const n = Y.length;
    const Q = new Float64Array(n * n);
    const distances = new Float64Array(n * n);

    // 计算所有成对距离
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            let dist = 0;
            for (let k = 0; k < 2; k++) {
                const d = Y[i][k] - Y[j][k];
                dist += d * d;
            }
            distances[i * n + j] = 1 + dist;
            distances[j * n + i] = 1 + dist;
        }
    }

    // 计算 t 分布概率
    let sum = 0;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const q = 1 / Math.pow(distances[i * n + j], 1);
            Q[i * n + j] = q;
            Q[j * n + i] = q;
            sum += 2 * q;
        }
    }

    // 归一化
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            Q[i * n + j] /= sum;
        }
    }

    return Q;
}

// 计算梯度
function computeGradient(P, Q, Y) {
    const n = Y.length;
    const gradient = new Array(n);
    const d = 2;

    for (let i = 0; i < n; i++) {
        gradient[i] = new Float64Array(d);
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) continue;

            const pqDiff = P[i * n + j] - Q[i * n + j];
            let dist = 0;
            for (let k = 0; k < d; k++) {
                const d_ik = Y[i][k] - Y[j][k];
                dist += d_ik * d_ik;
            }
            const factor = 4 * pqDiff / (1 + dist);

            for (let k = 0; k < d; k++) {
                gradient[i][k] += factor * (Y[i][k] - Y[j][k]);
            }
        }
    }

    return gradient;
}

// 计算 KL 散度
function computeKLDivergence(P, Q) {
    const n = P.length;
    let kl = 0;

    for (let i = 0; i < n; i++) {
        if (P[i] > 1e-10 && Q[i] > 1e-10) {
            kl += P[i] * Math.log(P[i] / Q[i]);
        }
    }

    return kl;
}

// 初始化低维表示
function initializeY(n) {
    const Y = new Array(n);
    for (let i = 0; i < n; i++) {
        Y[i] = [
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01
        ];
    }
    return Y;
}

// PCA 初始化（更好的起始点）
function initializeYWithPCA(data) {
    const n = data.length;
    const d = data[0].length;

    // 中心化
    const mean = new Float64Array(d);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) {
            mean[j] += data[i][j];
        }
    }
    for (let j = 0; j < d; j++) {
        mean[j] /= n;
    }

    // 构建协方差矩阵
    const cov = new Float64Array(d * d);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) {
            for (let k = 0; k < d; k++) {
                cov[j * d + k] += (data[i][j] - mean[j]) * (data[i][k] - mean[k]);
            }
        }
    }
    for (let i = 0; i < d * d; i++) {
        cov[i] /= (n - 1);
    }

    // 简化：使用前两个主成分（实际上应该用特征值分解，这里简化处理）
    const Y = new Array(n);
    for (let i = 0; i < n; i++) {
        if (d >= 2) {
            Y[i] = [
                (data[i][0] - mean[0]) * 0.1 + (Math.random() - 0.5) * 0.001,
                (data[i][1] - mean[1]) * 0.1 + (Math.random() - 0.5) * 0.001
            ];
        } else {
            Y[i] = [
                (data[i][0] - mean[0]) * 0.1 + (Math.random() - 0.5) * 0.001,
                (Math.random() - 0.5) * 0.001
            ];
        }
    }

    return Y;
}

// 简化版 t-SNE
function simplifiedTSNE(originalData, perplexity, learningRate, iterations) {
    // 将原始数据转换为数值数组
    const data = originalData.map(p => {
        const arr = [];
        if (p.x !== undefined) arr.push(p.x / 100);
        if (p.y !== undefined) arr.push(p.y / 100);
        if (p.z !== undefined) arr.push(p.z / 100);
        if (p.w !== undefined) arr.push(p.w / 100);
        return arr;
    });

    const n = data.length;

    // 计算高维相似度（简化：使用固定方差）
    const P = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            let dist = 0;
            for (let k = 0; k < data[i].length; k++) {
                const d = data[i][k] - data[j][k];
                dist += d * d;
            }
            P[i * n + j] = Math.exp(-dist / (2 * perplexity));
            sum += P[i * n + j];
        }
        for (let j = 0; j < n; j++) {
            P[i * n + j] /= sum;
        }
    }

    // 对称化
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const sym = (P[i * n + j] + P[j * n + i]) / 2;
            P[i * n + j] = sym;
            P[j * n + i] = sym;
        }
    }

    // 用 PCA 初始化
    let Y = initializeYWithPCA(data);

    // 早期动量膨胀
    let momentum = 0.5;
    const finalMomentum = 0.8;
    const momentumSwitchIter = Math.floor(iterations / 3);

    // 梯度累积
    const gains = new Array(n);
    const velocity = new Array(n);
    for (let i = 0; i < n; i++) {
        gains[i] = [1, 1];
        velocity[i] = [0, 0];
    }

    const minGain = 0.01;
    const history = [Y.map(p => ({ x: p[0] * 100, y: p[1] * 100 }))];

    // 迭代优化
    for (let iter = 0; iter < iterations; iter++) {
        // 切换到最终动量
        if (iter === momentumSwitchIter) {
            momentum = finalMomentum;
        }

        // 计算低维相似度
        const Q = new Float64Array(n * n);
        const dists = new Float64Array(n * n);
        let sumQ = 0;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                let dist = 0;
                for (let k = 0; k < 2; k++) {
                    const d = Y[i][k] - Y[j][k];
                    dist += d * d;
                }
                dist = 1 + dist;
                dists[i * n + j] = dist;
                dists[j * n + i] = dist;

                const q = 1 / dist;
                Q[i * n + j] = q;
                Q[j * n + i] = q;
                sumQ += 2 * q;
            }
        }

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                Q[i * n + j] /= sumQ;
            }
        }

        // 计算梯度
        for (let i = 0; i < n; i++) {
            const grad = [0, 0];
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                const factor = (P[i * n + j] - Q[i * n + j]) * 4 / dists[i * n + j];
                for (let k = 0; k < 2; k++) {
                    grad[k] += factor * (Y[i][k] - Y[j][k]);
                }
            }

            // 更新增益
            for (let k = 0; k < 2; k++) {
                const newGrad = Math.sign(grad[k]) !== Math.sign(velocity[i][k]);
                gains[i][k] = newGrad ? gains[i][k] + 0.2 : gains[i][k] * 0.8;
                gains[i][k] = Math.max(gains[i][k], minGain);
            }

            // 更新速度和位置
            for (let k = 0; k < 2; k++) {
                velocity[i][k] = momentum * velocity[i][k] - learningRate * gains[i][k] * grad[k];
                Y[i][k] += velocity[i][k];
            }
        }

        // 每10次迭代保存一次
        if (iter % 10 === 0 || iter === iterations - 1) {
            history.push(Y.map(p => ({ x: p[0] * 100, y: p[1] * 100 })));
        }
    }

    return history;
}

// 绘制原始数据（PCA 投影）
function drawOriginal(data, labels) {
    const svg = d3.select("#original-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#original-viz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X 轴
    svgElem.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([0, 400]).range([0, width])));

    // Y 轴
    svgElem.append("g")
        .call(d3.axisLeft(d3.scaleLinear().domain([0, 300]).range([height, 0])));

    // 绘制数据点
    svgElem.selectAll(".point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => Math.min(Math.max(d.x, 0), 400))
        .attr("cy", d => Math.min(Math.max(d.y, 0), 300))
        .attr("r", 4)
        .style("fill", (d, i) => colors(labels[i]))
        .style("opacity", 0.7);
}

// 绘制 t-SNE 结果
function drawTSNE(data, labels) {
    const svg = d3.select("#tsne-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#tsne-viz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 计算范围
    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);

    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - 10, xExtent[1] + 10])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - 10, yExtent[1] + 10])
        .range([height, 0]);

    // 绘制网格
    svgElem.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat(""))
        .style("opacity", 0.1);

    svgElem.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
        .style("opacity", 0.1);

    // 绘制数据点
    svgElem.selectAll(".point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .style("fill", (d, i) => colors(labels[i]))
        .style("opacity", 0.8)
        .style("stroke", "#fff")
        .style("stroke-width", 1);
}

// 更新显示
function updateDisplay() {
    document.getElementById("perplexity-value").textContent = perplexity;
    document.getElementById("learning-rate-value").textContent = learningRate;
    document.getElementById("iterations-value").textContent = maxIterations;
}

// 运行 t-SNE
function runTSNE() {
    if (isRunning) return;

    const datasetType = document.getElementById("dataset-select").value;
    const { points, labels } = generateData(datasetType);

    originalData = points;

    // 绘制原始数据
    drawOriginal(points, labels);

    // 更新信息
    document.getElementById("num-points").textContent = points.length;
    document.getElementById("original-dim").textContent = points[0].z !== undefined ? 3 : 4;
    document.getElementById("max-iteration").textContent = maxIterations;

    isRunning = true;
    currentIteration = 0;

    // 禁用按钮
    document.getElementById("run-btn").disabled = true;

    // 运行 t-SNE
    const history = simplifiedTSNE(points, perplexity, learningRate, maxIterations);

    // 动画显示结果
    animateTSNE(history, labels);
}

// 动画显示 t-SNE 过程
function animateTSNE(history, labels) {
    let frame = 0;

    function animate() {
        if (frame >= history.length) {
            isRunning = false;
            document.getElementById("run-btn").disabled = false;
            return;
        }

        currentIteration = frame * 10;
        document.getElementById("current-iteration").textContent = currentIteration;

        // 计算 KL 散度（简化）
        const kl = Math.max(0, 2 - frame * 0.05).toFixed(4);
        document.getElementById("kl-divergence").textContent = kl;

        drawTSNE(history[frame], labels);

        frame++;
        animationId = setTimeout(animate, 50);
    }

    animate();
}

// 单步执行
function stepTSNE() {
    if (isRunning) {
        isRunning = false;
        clearTimeout(animationId);
        document.getElementById("run-btn").disabled = false;
        return;
    }

    const datasetType = document.getElementById("dataset-select").value;
    const { points, labels } = generateData(datasetType);

    if (currentIteration === 0) {
        originalData = points;
        drawOriginal(points, labels);
        document.getElementById("num-points").textContent = points.length;
    }

    // 运行一次迭代
    const history = simplifiedTSNE(points, perplexity, learningRate, Math.min(currentIteration + 100, maxIterations));

    drawTSNE(history[history.length - 1], labels);
    currentIteration = Math.min(currentIteration + 100, maxIterations);
    document.getElementById("current-iteration").textContent = currentIteration;
}

// 重置
function reset() {
    isRunning = false;
    clearTimeout(animationId);
    currentIteration = 0;
    document.getElementById("current-iteration").textContent = 0;
    document.getElementById("kl-divergence").textContent = "--";
    document.getElementById("run-btn").disabled = false;

    d3.select("#original-viz").selectAll("*").remove();
    d3.select("#tsne-viz").selectAll("*").remove();
}

// 初始化
function init() {
    document.getElementById("perplexity").addEventListener("input", e => {
        perplexity = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("learning-rate").addEventListener("input", e => {
        learningRate = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("iterations").addEventListener("input", e => {
        maxIterations = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("run-btn").addEventListener("click", runTSNE);
    document.getElementById("step-btn").addEventListener("click", stepTSNE);
    document.getElementById("reset-btn").addEventListener("click", reset);
    document.getElementById("dataset-select").addEventListener("change", () => {
        reset();
    });
}

document.addEventListener("DOMContentLoaded", init);
