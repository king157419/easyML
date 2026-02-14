// DBSCAN 密度聚类可视化

// D3.js 配置
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

let data = [];
let labels = [];
let pointTypes = []; // 'core', 'border', 'noise'
let clusters = [];
let epsilon = 30;
let minPts = 4;
let showNeighborhood = false;
let currentStep = 0;
let maxSteps = 0;

// 颜色映射
const clusterColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const noiseColor = '#ef4444';

// SVG 容器
let svg, g;

// 数据生成器
function generateData(type) {
    const points = [];

    switch(type) {
        case 'blobs':
            // 3个球形聚类
            const centers = [
                { x: 200, y: 150 },
                { x: 400, y: 250 },
                { x: 600, y: 350 }
            ];
            centers.forEach(center => {
                for (let i = 0; i < 50; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 40;
                    points.push({
                        x: center.x + Math.cos(angle) * radius,
                        y: center.y + Math.sin(angle) * radius
                    });
                }
            });
            break;

        case 'moons':
            // 两个月形
            for (let i = 0; i < 100; i++) {
                const t = i / 100 * Math.PI;
                points.push({
                    x: 200 + Math.cos(t) * 100,
                    y: 200 + Math.sin(t) * 100 + (Math.random() - 0.5) * 10
                });
            }
            for (let i = 0; i < 100; i++) {
                const t = i / 100 * Math.PI;
                points.push({
                    x: 350 + Math.cos(t + Math.PI) * 100,
                    y: 300 + Math.sin(t + Math.PI) * 100 + (Math.random() - 0.5) * 10
                });
            }
            break;

        case 'circles':
            // 同心圆
            for (let i = 0; i < 120; i++) {
                const angle = (i / 120) * Math.PI * 2;
                const r1 = 60 + (Math.random() - 0.5) * 10;
                points.push({
                    x: 400 + Math.cos(angle) * r1,
                    y: 250 + Math.sin(angle) * r1
                });
                const r2 = 140 + (Math.random() - 0.5) * 10;
                points.push({
                    x: 400 + Math.cos(angle) * r2,
                    y: 250 + Math.sin(angle) * r2
                });
            }
            break;

        case 'random':
            // 随机分布
            for (let i = 0; i < 150; i++) {
                points.push({
                    x: 100 + Math.random() * 600,
                    y: 50 + Math.random() * 400
                });
            }
            break;
    }

    return points;
}

// 计算两点之间的欧氏距离
function distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// 区域查询：找到点 p 的 ε-邻域内的所有点
function regionQuery(p, points, eps) {
    const neighbors = [];
    for (let i = 0; i < points.length; i++) {
        if (distance(p, points[i]) <= eps) {
            neighbors.push(i);
        }
    }
    return neighbors;
}

// 扩展聚类
function expandCluster(pointIdx, neighbors, clusterId, points, eps, minPts, labels, pointTypes) {
    labels[pointIdx] = clusterId;
    pointTypes[pointIdx] = 'core';

    // 创建邻居队列的副本用于遍历
    let i = 0;
    while (i < neighbors.length) {
        const currentIdx = neighbors[i];

        if (pointTypes[currentIdx] === 'noise') {
            labels[currentIdx] = clusterId;
            pointTypes[currentIdx] = 'border';
        }

        if (labels[currentIdx] === -1) {
            labels[currentIdx] = clusterId;
            const currentNeighbors = regionQuery(points[currentIdx], points, eps);

            if (currentNeighbors.length >= minPts) {
                pointTypes[currentIdx] = 'core';
                // 添加新邻居
                for (let j = 0; j < currentNeighbors.length; j++) {
                    const nn = currentNeighbors[j];
                    if (labels[nn] === -1 || pointTypes[nn] === 'noise') {
                        neighbors.push(nn);
                    }
                }
            } else {
                pointTypes[currentIdx] = 'border';
            }
        }
        i++;
    }
}

// DBSCAN 算法
function dbscan(points, eps, minPts) {
    const n = points.length;
    const labels = new Array(n).fill(-1); // -1 表示未分类
    const pointTypes = new Array(n).fill('noise');
    let clusterId = 0;

    for (let i = 0; i < n; i++) {
        if (labels[i] !== -1) continue; // 已分类

        const neighbors = regionQuery(points[i], points, eps);

        if (neighbors.length < minPts) {
            labels[i] = -2; // 标记为噪声（临时）
            pointTypes[i] = 'noise';
        } else {
            // 创建新聚类
            expandCluster(i, neighbors, clusterId, points, eps, minPts, labels, pointTypes);
            clusterId++;
        }
    }

    // 将 -2 转换为正式的噪声标记
    for (let i = 0; i < n; i++) {
        if (labels[i] === -2) {
            labels[i] = -1;
        }
    }

    return { labels, pointTypes, numClusters: clusterId };
}

// 绘制数据点和聚类结果
function drawData(highlightPoint = null, highlightNeighbors = null) {
    g.selectAll(".data-point").remove();
    g.selectAll(".neighborhood-circle").remove();

    // 绘制邻域圆（如果启用）
    if (showNeighborhood && highlightPoint !== null) {
        g.append("circle")
            .attr("class", "neighborhood-circle")
            .attr("cx", data[highlightPoint].x)
            .attr("cy", data[highlightPoint].y)
            .attr("r", epsilon)
            .style("fill", "none")
            .style("stroke", "#8b5cf6")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5")
            .style("opacity", 0.5);
    }

    // 绘制高亮邻居
    if (highlightNeighbors !== null) {
        highlightNeighbors.forEach(idx => {
            g.append("circle")
                .attr("class", "neighborhood-circle")
                .attr("cx", data[idx].x)
                .attr("cy", data[idx].y)
                .attr("r", epsilon / 2)
                .style("fill", "none")
                .style("stroke", "#f59e0b")
                .style("stroke-width", 2)
                .style("stroke-dasharray", "3,3")
                .style("opacity", 0.5);
        });
    }

    // 绘制数据点
    g.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", (d, i) => {
            if (pointTypes[i] === 'core') return 7;
            return 5;
        })
        .style("fill", (d, i) => {
            if (labels[i] === -1) return noiseColor;
            return clusterColors[labels[i] % clusterColors.length];
        })
        .style("stroke", (d, i) => {
            if (pointTypes[i] === 'core') return '#fff';
            if (labels[i] === -1) return '#fff';
            return 'none';
        })
        .style("stroke-width", (d, i) => {
            if (pointTypes[i] === 'core') return 3;
            return 1;
        })
        .style("opacity", 0.8)
        .on("mouseover", function(event, d, i) {
            if (showNeighborhood) {
                const neighbors = regionQuery(data[i], data, epsilon);
                drawData(i, neighbors);

                // 显示信息
                d3.select(this)
                    .attr("r", 10)
                    .style("stroke", "#8b5cf6");
            }
        })
        .on("mouseout", function(event, d, i) {
            if (showNeighborhood) {
                drawData();
            }
        });
}

// 更新统计信息
function updateStats() {
    const clusterSet = new Set(labels.filter(l => l !== -1));
    document.getElementById("num-clusters").textContent = clusterSet.size;
    document.getElementById("noise-count").textContent = labels.filter(l => l === -1).length;
    document.getElementById("core-count").textContent = pointTypes.filter(t => t === 'core').length;
    document.getElementById("border-count").textContent = pointTypes.filter(t => t === 'border').length;
}

// 运行 DBSCAN
function runDBSCAN() {
    const result = dbscan(data, epsilon, minPts);
    labels = result.labels;
    pointTypes = result.pointTypes;
    clusters = result.numClusters;

    drawData();
    updateStats();
}

// 初始化可视化
function initVisualization() {
    const container = document.getElementById('visualization');
    container.innerHTML = '';

    svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 绘制坐标轴
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([0, 800]).range([0, width])));

    g.append('g')
        .call(d3.axisLeft(d3.scaleLinear().domain([0, 500]).range([height, 0])));
}

// 重置
function reset() {
    const datasetType = document.getElementById('dataset-select').value;
    data = generateData(datasetType);
    labels = new Array(data.length).fill(-1);
    pointTypes = new Array(data.length).fill('noise');
    clusters = 0;

    initVisualization();
    drawData();
    updateStats();
}

// 更新显示值
function updateDisplay() {
    document.getElementById("epsilon-value").textContent = epsilon;
    document.getElementById("minpts-value").textContent = minPts;
}

// 初始化
function init() {
    document.getElementById("epsilon").addEventListener("input", e => {
        epsilon = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("minpts").addEventListener("input", e => {
        minPts = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("show-neighborhood").addEventListener("change", e => {
        showNeighborhood = e.target.checked;
    });

    document.getElementById("run-btn").addEventListener("click", runDBSCAN);
    document.getElementById("reset-btn").addEventListener("click", reset);
    document.getElementById("dataset-select").addEventListener("change", reset);

    // 初始加载数据
    reset();
}

document.addEventListener("DOMContentLoaded", init);
