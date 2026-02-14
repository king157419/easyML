// 层次聚类可视化

// D3.js 配置
const margin = {top: 20, right: 20, bottom: 30, left: 30};
const vizWidth = 400;
const vizHeight = 350;

let data = [];
let clusters = [];
let mergeHistory = [];
let currentStep = 0;
let numDesiredClusters = 3;
let linkageMethod = 'average';
let distanceMetric = 'euclidean';
let animationSpeed = 5;

// 颜色
const clusterColors = d3.scaleOrdinal(d3.schemeCategory10);

// 距离计算
function distance(p1, p2, metric = 'euclidean') {
    if (metric === 'euclidean') {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    } else if (metric === 'manhattan') {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    }
}

// 聚类间距离（不同链接方式）
function clusterDistance(c1, c2, linkage, metric) {
    if (linkage === 'single') {
        // 单链接：最近点
        let minDist = Infinity;
        c1.points.forEach(p1 => {
            c2.points.forEach(p2 => {
                const d = distance(p1, p2, metric);
                if (d < minDist) minDist = d;
            });
        });
        return minDist;

    } else if (linkage === 'complete') {
        // 全链接：最远点
        let maxDist = -Infinity;
        c1.points.forEach(p1 => {
            c2.points.forEach(p2 => {
                const d = distance(p1, p2, metric);
                if (d > maxDist) maxDist = d;
            });
        });
        return maxDist;

    } else if (linkage === 'average') {
        // 平均链接
        let sum = 0;
        c1.points.forEach(p1 => {
            c2.points.forEach(p2 => {
                sum += distance(p1, p2, metric);
            });
        });
        return sum / (c1.points.length * c2.points.length);

    } else if (linkage === 'ward') {
        // Ward 方法：基于中心点
        const c1Center = {
            x: c1.points.reduce((s, p) => s + p.x, 0) / c1.points.length,
            y: c1.points.reduce((s, p) => s + p.y, 0) / c1.points.length
        };
        const c2Center = {
            x: c2.points.reduce((s, p) => s + p.x, 0) / c2.points.length,
            y: c2.points.reduce((s, p) => s + p.y, 0) / c2.points.length
        };
        const n1 = c1.points.length;
        const n2 = c2.points.length;
        const dist = distance(c1Center, c2Center, metric);
        return (n1 * n2 / (n1 + n2)) * dist * dist;
    }
}

// 层次聚类算法
function hierarchicalClustering(points, linkage, metric) {
    // 初始化：每个点是一个聚类
    let clusters = points.map((p, i) => ({
        id: i,
        points: [p],
        left: null,
        right: null,
        height: 0
    }));

    const history = [clusters.map(c => ({ ...c, points: [...c.points] }))];

    // 合并直到只剩一个聚类
    while (clusters.length > 1) {
        let minDist = Infinity;
        let mergeI = -1, mergeJ = -1;

        // 找到最近的两个聚类
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const d = clusterDistance(clusters[i], clusters[j], linkage, metric);
                if (d < minDist) {
                    minDist = d;
                    mergeI = i;
                    mergeJ = j;
                }
            }
        }

        // 合并聚类
        const merged = {
            id: clusters.length + history.length,
            points: [...clusters[mergeI].points, ...clusters[mergeJ].points],
            left: clusters[mergeI],
            right: clusters[mergeJ],
            height: minDist
        };

        // 移除旧聚类，添加新聚类
        clusters = clusters.filter((_, i) => i !== mergeI && i !== mergeJ);
        clusters.push(merged);

        history.push(clusters.map(c => ({
            ...c,
            points: [...c.points]
        })));
    }

    return history;
}

// 从树状图获取指定数量的聚类
function getClustersAtLevel(tree, numClusters) {
    // tree 是最终的根节点
    const result = [];

    function traverse(node, targetCount, currentNodes) {
        if (currentNodes.length >= targetCount) {
            result.push(...currentNodes);
            return;
        }

        const newNodes = [];
        for (const n of currentNodes) {
            if (n.left && n.right) {
                newNodes.push(n.left, n.right);
            } else {
                newNodes.push(n);
            }
        }

        if (newNodes.length === currentNodes.length) {
            result.push(...newNodes);
            return;
        }

        traverse(node, targetCount, newNodes);
    }

    traverse(tree, numClusters, [tree]);
    return result.slice(0, numClusters);
}

// 绘制数据点
function drawDataViz() {
    const svg = d3.select("#data-viz")
        .selectAll("*")
        .remove();

    const svgElem = d3.select("#data-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
        .domain([0, 400])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 350])
        .range([height, 0]);

    // 当前聚类状态
    const currentClusters = mergeHistory[Math.min(currentStep, mergeHistory.length - 1)];

    // 为每个聚类分配颜色
    const clusterAssignments = new Map();
    currentClusters.forEach((c, i) => {
        c.points.forEach(p => {
            clusterAssignments.set(p, i);
        });
    });

    // 绘制连接线（同一聚类的点）
    currentClusters.forEach((c, clusterIdx) => {
        if (c.points.length > 1) {
            g.selectAll(".cluster-line-" + clusterIdx)
                .data([...c.points, c.points[0]]) // 闭合
                .enter()
                .append("line")
                .attr("x1", (d, i) => i < c.points.length ? xScale(d.x) : xScale(c.points[0].x))
                .attr("y1", (d, i) => i < c.points.length ? yScale(d.y) : yScale(c.points[0].y))
                .attr("x2", (d, i) => {
                    if (i === c.points.length) return xScale(c.points[0].x);
                    const next = c.points[(i + 1) % c.points.length];
                    return xScale(next.x);
                })
                .attr("y2", (d, i) => {
                    if (i === c.points.length) return yScale(c.points[0].y);
                    const next = c.points[(i + 1) % c.points.length];
                    return yScale(next.y);
                })
                .style("stroke", clusterColors(clusterIdx))
                .style("stroke-width", 1)
                .style("opacity", 0.3);
        }
    });

    // 绘制数据点
    g.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 6)
        .style("fill", d => clusterColors(clusterAssignments.get(d)))
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .style("opacity", 0.8);

    // 绘制中心点
    currentClusters.forEach((c, i) => {
        const cx = c.points.reduce((s, p) => s + p.x, 0) / c.points.length;
        const cy = c.points.reduce((s, p) => s + p.y, 0) / c.points.length;

        g.append("circle")
            .attr("cx", xScale(cx))
            .attr("cy", yScale(cy))
            .attr("r", 8)
            .style("fill", clusterColors(i))
            .style("stroke", "#fff")
            .style("stroke-width", 2)
            .style("opacity", 0.5);
    });
}

// 绘制树状图
function drawDendrogram() {
    const svg = d3.select("#dendrogram-viz")
        .selectAll("*")
        .remove();

    if (mergeHistory.length === 0) return;

    const svgElem = d3.select("#dendrogram-viz")
        .append("svg")
        .attr("width", vizWidth)
        .attr("height", vizHeight);

    const g = svgElem.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const width = vizWidth - margin.left - margin.right;
    const height = vizHeight - margin.top - margin.bottom;

    // 构建层次结构
    const root = mergeHistory[mergeHistory.length - 1][0];

    // 计算布局
    const leafCount = data.length;
    const leafWidth = width / leafCount;

    // 为每个叶子节点分配位置
    const leafPositions = new Map();
    data.forEach((p, i) => {
        leafPositions.set(p, i * leafWidth + leafWidth / 2);
    });

    // 计算每个节点的位置
    function computePositions(node) {
        if (!node.left && !node.right) {
            node.x = leafPositions.get(node.points[0]);
            node.y = height - (node.height / 100) * (height - 30);
            return;
        }

        computePositions(node.left);
        computePositions(node.right);

        node.x = (node.left.x + node.right.x) / 2;
        node.y = height - (node.height / 100) * (height - 30);
    }

    computePositions(root);

    // 绘制连接线
    function drawLinks(node) {
        if (node.left && node.right) {
            // 左子节点连接
            g.append("path")
                .attr("d", d3.linkHorizontal()({
                    source: { x: node.x, y: node.y },
                    target: { x: node.left.x, y: node.left.y }
                }))
                .style("fill", "none")
                .style("stroke", "#6b7280")
                .style("stroke-width", 2);

            // 右子节点连接
            g.append("path")
                .attr("d", d3.linkHorizontal()({
                    source: { x: node.x, y: node.y },
                    target: { x: node.right.x, y: node.right.y }
                }))
                .style("fill", "none")
                .style("stroke", "#6b7280")
                .style("stroke-width", 2);

            drawLinks(node.left);
            drawLinks(node.right);
        }
    }

    drawLinks(root);

    // 绘制节点
    function drawNodes(node, depth = 0) {
        if (!node) return;

        g.append("circle")
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", 4)
            .style("fill", depth <= (mergeHistory.length - currentStep) ? "#10b981" : "#ef4444")
            .style("opacity", 0.8);

        if (node.left) drawNodes(node.left, depth + 1);
        if (node.right) drawNodes(node.right, depth + 1);
    }

    drawNodes(root);

    // 绘制切割线（显示当前聚类数）
    if (currentStep < mergeHistory.length - 1) {
        const currentClusters = mergeHistory[currentStep];
        const mergeDist = mergeHistory[currentStep + 1][0].height;

        const cutY = height - (mergeDist / 100) * (height - 30);

        g.append("line")
            .attr("x1", 0).attr("y1", cutY)
            .attr("x2", width).attr("y2", cutY)
            .style("stroke", "#f59e0b")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5");
    }
}

// 更新统计信息
function updateStats() {
    const currentClusters = mergeHistory[Math.min(currentStep, mergeHistory.length - 1)];
    document.getElementById("current-level").textContent = currentStep;
    document.getElementById("merge-distance").textContent =
        currentStep < mergeHistory.length - 1 ? mergeHistory[currentStep + 1][0].height.toFixed(2) : "--";
    document.getElementById("cluster-count").textContent = currentClusters.length;
}

// 运行聚类
function runClustering() {
    mergeHistory = hierarchicalClustering(data, linkageMethod, distanceMetric);
    currentStep = mergeHistory.length - 1;
    updateVisualization();
}

// 更新可视化
function updateVisualization() {
    drawDataViz();
    drawDendrogram();
    updateStats();
}

// 生成数据
function generateData(type) {
    const points = [];

    switch(type) {
        case 'blobs':
            const centers = [
                { x: 100, y: 100 },
                { x: 250, y: 200 },
                { x: 300, y: 80 }
            ];
            centers.forEach(center => {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * 30;
                    points.push({
                        x: center.x + Math.cos(angle) * r,
                        y: center.y + Math.sin(angle) * r
                    });
                }
            });
            break;

        case 'chain':
            // 链状数据
            for (let i = 0; i < 30; i++) {
                points.push({
                    x: 80 + i * 10 + (Math.random() - 0.5) * 15,
                    y: 150 + Math.sin(i * 0.3) * 50 + (Math.random() - 0.5) * 15
                });
            }
            break;

        case 'uneven':
            // 不均匀大小聚类
            const unevenCenters = [
                { x: 100, y: 100, count: 30 },
                { x: 300, y: 200, count: 8 },
                { x: 200, y: 50, count: 15 }
            ];
            unevenCenters.forEach(c => {
                for (let i = 0; i < c.count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.random() * 25;
                    points.push({
                        x: c.x + Math.cos(angle) * r,
                        y: c.y + Math.sin(angle) * r
                    });
                }
            });
            break;
    }

    return points;
}

// 更新显示
function updateDisplay() {
    document.getElementById("num-clusters-value").textContent = numDesiredClusters;
    document.getElementById("anim-speed-value").textContent = animationSpeed;
}

// 初始化
function init() {
    document.getElementById("dataset-select").addEventListener("change", e => {
        data = generateData(e.target.value);
        mergeHistory = [];
        currentStep = 0;
        updateVisualization();
    });

    document.getElementById("linkage-select").addEventListener("change", e => {
        linkageMethod = e.target.value;
    });

    document.getElementById("distance-select").addEventListener("change", e => {
        distanceMetric = e.target.value;
    });

    document.getElementById("num-clusters").addEventListener("input", e => {
        numDesiredClusters = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("anim-speed").addEventListener("input", e => {
        animationSpeed = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById("run-btn").addEventListener("click", runClustering);

    document.getElementById("step-btn").addEventListener("click", () => {
        if (mergeHistory.length === 0) {
            mergeHistory = hierarchicalClustering(data, linkageMethod, distanceMetric);
        }

        if (currentStep < mergeHistory.length - 1) {
            currentStep++;
            updateVisualization();
        }
    });

    document.getElementById("reset-btn").addEventListener("click", () => {
        mergeHistory = [];
        currentStep = 0;
        updateVisualization();
    });

    // 初始数据
    data = generateData('blobs');
    updateDisplay();
    updateVisualization();
}

document.addEventListener("DOMContentLoaded", init);
