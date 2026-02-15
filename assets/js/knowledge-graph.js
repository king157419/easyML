// MLTutor 知识图谱 - D3.js 力导向图实现

// 知识树结构数据
const knowledgeData = {
    name: "机器学习",
    nameEn: "Machine Learning",
    children: [
        {
            name: "监督学习",
            nameEn: "Supervised Learning",
            children: [
                {
                    name: "回归",
                    nameEn: "Regression",
                    children: [
                        { name: "线性回归", url: "algorithms/linear-regression/index.html", visualLevel: 1 },
                        { name: "多项式回归", url: "algorithms/polynomial-regression/index.html", visualLevel: 1 },
                        { name: "Ridge", url: "algorithms/ridge-regression/index.html", visualLevel: 2 },
                        { name: "Lasso", url: "algorithms/lasso-regression/index.html", visualLevel: 2 }
                    ]
                },
                {
                    name: "分类",
                    nameEn: "Classification",
                    children: [
                        { name: "逻辑回归", url: "algorithms/logistic-regression/index.html", visualLevel: 1 },
                        { name: "SVM", url: "algorithms/svm/index.html", visualLevel: 3, highlight: true },
                        { name: "KNN", url: "algorithms/knn/index.html", visualLevel: 1 },
                        { name: "决策树", url: "algorithms/decision-tree/index.html", visualLevel: 2 },
                        { name: "随机森林", url: "algorithms/random-forest/index.html", visualLevel: 3 },
                        { name: "朴素贝叶斯", url: "algorithms/naive-bayes/index.html", visualLevel: 2 }
                    ]
                },
                {
                    name: "神经网络",
                    nameEn: "Neural Networks",
                    children: [
                        { name: "前馈网络", url: "algorithms/nn/index.html", visualLevel: 3 },
                        { name: "CNN", url: "algorithms/cnn/index.html", visualLevel: 4 },
                        { name: "RNN", url: "algorithms/rnn/index.html", visualLevel: 4 },
                        { name: "Attention", url: "algorithms/attention/index.html", visualLevel: 4 }
                    ]
                }
            ]
        },
        {
            name: "无监督学习",
            nameEn: "Unsupervised Learning",
            children: [
                {
                    name: "聚类",
                    nameEn: "Clustering",
                    children: [
                        { name: "K-Means", url: "algorithms/k-means/index.html", visualLevel: 1 },
                        { name: "DBSCAN", url: "algorithms/dbscan/index.html", visualLevel: 2 },
                        { name: "层次聚类", url: "algorithms/hierarchical-clustering/index.html", visualLevel: 2 }
                    ]
                },
                {
                    name: "降维",
                    nameEn: "Dim Reduction",
                    children: [
                        { name: "PCA", url: "algorithms/pca/index.html", visualLevel: 2 },
                        { name: "t-SNE", url: "algorithms/tsne/index.html", visualLevel: 2 },
                        { name: "LDA", url: "algorithms/lda/index.html", visualLevel: 2 }
                    ]
                }
            ]
        },
        {
            name: "强化学习",
            nameEn: "Reinforcement Learning",
            children: [
                { name: "Q-Learning", url: "algorithms/q-learning/index.html", visualLevel: 5 },
                { name: "策略梯度", url: "algorithms/policy-gradient/index.html", visualLevel: 5 },
                { name: "Actor-Critic", url: "algorithms/actor-critic/index.html", visualLevel: 5 }
            ]
        }
    ]
};

// 颜色映射
const levelColors = {
    1: "#10b981",
    2: "#3b82f6",
    3: "#f59e0b",
    4: "#ef4444",
    5: "#8b5cf6"
};

const depthColors = {
    0: "#1e40af",
    1: "#7c3aed",
    2: "#0891b2",
    3: "#059669"
};

// 全局变量
let simulation, svg, g, link, node;
let currentTransform = d3.zoomIdentity;

// 初始化知识图谱
function initKnowledgeGraph() {
    const container = document.getElementById('knowledge-graph');
    if (!container) {
        console.error('Knowledge graph container not found!');
        return;
    }

    // 获取父容器高度，自适应屏幕
    const parent = container.parentElement;
    const width = parent.clientWidth - 40;
    const height = Math.max(500, parent.clientHeight - 40);

    console.log('Initializing force-directed knowledge graph...');

    // 清空容器
    d3.select('#knowledge-graph').selectAll('*').remove();

    // 创建 SVG
    svg = d3.select('#knowledge-graph')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('min-height', height + 'px')
        .attr('viewBox', [0, 0, width, height])
        .attr('preserveAspectRatio', 'xMidYMid meet');

    // 添加缩放功能 - 仅响应 Ctrl+滚轮或双指手势
    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .filter((event) => {
            // 允许：双指手势（触控板/触屏）、Ctrl+滚轮
            if (event.type === 'mousedown' && event.button === 0) return true;
            if (event.type === 'wheel') {
                // 检测触控板双指滚动（通常 ctrlKey 为 false 但有明显惯性）
                // 或 Ctrl + 滚轮
                return event.ctrlKey || event.touches > 0;
            }
            if (event.type === 'touchstart' || event.type === 'touchmove') return true;
            return false;
        })
        .on('zoom', (event) => {
            g.transition().duration(50).attr('transform', event.transform);
            currentTransform = event.transform;
        });

    svg.call(zoom);

    // 创建主组
    g = svg.append('g');

    // 将层级数据转换为节点和边数组
    const root = d3.hierarchy(knowledgeData);
    const nodes = root.descendants();
    const links = root.links();

    // 为节点分配初始位置（径向布局）
    const radius = Math.min(width, height) / 2 - 80;
    nodes.forEach((d, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const r = d.depth === 0 ? 0 : (d.depth === 1 ? radius * 0.3 : (d.depth === 2 ? radius * 0.55 : radius * 0.85));
        d.x = width / 2 + r * Math.cos(angle - Math.PI / 2);
        d.y = height / 2 + r * Math.sin(angle - Math.PI / 2);
    });

    // 创建力模拟 - 调整参数更丝滑
    simulation = d3.forceSimulation(nodes)
        .alphaDecay(0.01)       // 更慢的冷却速度
        .velocityDecay(0.3)     // 阻尼系数
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(d => 50 + d.source.depth * 25)
            .strength(0.7))
        .force('charge', d3.forceManyBody()
            .strength(-180)
            .distanceMax(350))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 15).strength(0.8))
        .force('radial', d3.forceRadial(d => d.depth * 90, width / 2, height / 2).strength(0.25));

    // 绘制连接线
    link = g.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('class', 'link')
        .style('stroke', '#cbd5e1')
        .style('stroke-width', 1.5)
        .style('stroke-opacity', 0.6);

    // 绘制节点
    node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        .style('cursor', d => d.data.url ? 'pointer' : 'grab')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // 节点圆形
    node.append('circle')
        .attr('r', d => getNodeRadius(d))
        .style('fill', d => d.data.visualLevel ? levelColors[d.data.visualLevel] : depthColors[d.depth])
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('filter', d => d.data.highlight ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.8))' : 'none')
        .on('click', function(event, d) {
            if (d.data.url) {
                window.location.href = d.data.url;
            }
        })
        .on('mouseover', function(event, d) {
            if (d.data.url) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .attr('r', getNodeRadius(d) + 4);
            }
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('r', getNodeRadius(d));
        });

    // 节点标签
    node.append('text')
        .text(d => d.data.name)
        .attr('dy', '0.35em')
        .attr('x', d => getNodeRadius(d) + 6)
        .style('font-size', d => d.depth === 0 ? '14px' : (d.depth === 1 ? '12px' : '11px'))
        .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
        .style('fill', '#1f2937')
        .style('pointer-events', 'none');

    // 更新位置
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    console.log('Knowledge graph rendered with', nodes.length, 'nodes');
}

function getNodeRadius(d) {
    if (d.depth === 0) return 20;
    if (d.depth === 1) return 16;
    if (d.depth === 2) return 12;
    return 10;
}

function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.2).restart();
    d.fx = d.x;
    d.fy = d.y;
    d3.select(this).raise();
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    // 延迟释放，让动画更平滑
    setTimeout(() => {
        d.fx = null;
        d.fy = null;
    }, 100);
}

// 窗口大小改变时重新绘制
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initKnowledgeGraph, 300);
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, waiting for D3...');
    initKnowledgeGraph();
});

// ============================================
// 算法进化史数据
// ============================================

const evolutionData = {
    nodes: [
        // 回归系列
        { id: "linear-regression", name: "线性回归", year: 1805,
          brief: "最基础的回归方法，用直线拟合数据",
          url: "algorithms/linear-regression/index.html" },
        { id: "polynomial-regression", name: "多项式回归", year: 1815,
          brief: "解决非线性关系，用曲线拟合",
          url: "algorithms/polynomial-regression/index.html" },
        { id: "ridge-regression", name: "Ridge回归", year: 1970,
          brief: "L2正则化，解决过拟合问题",
          url: "algorithms/ridge-regression/index.html" },
        { id: "lasso-regression", name: "Lasso回归", year: 1996,
          brief: "L1正则化，可做特征选择",
          url: "algorithms/lasso-regression/index.html" },

        // 分类系列
        { id: "logistic-regression", name: "逻辑回归", year: 1958,
          brief: "经典分类算法，输出概率",
          url: "algorithms/logistic-regression/index.html" },
        { id: "knn", name: "K近邻", year: 1951,
          brief: "简单直观，基于距离的分类",
          url: "algorithms/knn/index.html" },
        { id: "naive-bayes", name: "朴素贝叶斯", year: 1960,
          brief: "基于概率的快速分类器",
          url: "algorithms/naive-bayes/index.html" },
        { id: "decision-tree", name: "决策树", year: 1986,
          brief: "可解释性强，树形决策",
          url: "algorithms/decision-tree/index.html" },
        { id: "svm", name: "SVM", year: 1995,
          brief: "最大化分类间隔，核技巧处理非线性",
          url: "algorithms/svm/index.html" },
        { id: "random-forest", name: "随机森林", year: 2001,
          brief: "多棵树投票，解决单树过拟合",
          url: "algorithms/random-forest/index.html" },

        // 神经网络系列
        { id: "nn", name: "神经网络", year: 1986,
          brief: "反向传播，多层感知机",
          url: "algorithms/nn/index.html" },
        { id: "cnn", name: "CNN", year: 1998,
          brief: "卷积提取局部特征，图像处理利器",
          url: "algorithms/cnn/index.html" },
        { id: "rnn", name: "RNN", year: 1986,
          brief: "处理序列数据，有记忆能力",
          url: "algorithms/rnn/index.html" },
        { id: "attention", name: "Attention", year: 2014,
          brief: "注意力机制，Transformer的核心",
          url: "algorithms/attention/index.html" },

        // 聚类系列
        { id: "k-means", name: "K-Means", year: 1957,
          brief: "经典聚类，需指定簇数",
          url: "algorithms/k-means/index.html" },
        { id: "hierarchical-clustering", name: "层次聚类", year: 1963,
          brief: "树状结构，不需要预设簇数",
          url: "algorithms/hierarchical-clustering/index.html" },
        { id: "dbscan", name: "DBSCAN", year: 1996,
          brief: "密度聚类，可发现任意形状簇",
          url: "algorithms/dbscan/index.html" },

        // 降维系列
        { id: "pca", name: "PCA", year: 1901,
          brief: "线性降维，保留主要方差",
          url: "algorithms/pca/index.html" },
        { id: "lda", name: "LDA", year: 1936,
          brief: "有监督降维，最大化类间距离",
          url: "algorithms/lda/index.html" },
        { id: "tsne", name: "t-SNE", year: 2008,
          brief: "非线性降维，可视化效果好",
          url: "algorithms/tsne/index.html" },

        // 强化学习系列
        { id: "q-learning", name: "Q-Learning", year: 1989,
          brief: "基于价值的学习，表格型RL",
          url: "algorithms/q-learning/index.html" },
        { id: "policy-gradient", name: "策略梯度", year: 1992,
          brief: "直接优化策略，连续动作空间",
          url: "algorithms/policy-gradient/index.html" },
        { id: "actor-critic", name: "Actor-Critic", year: 2000,
          brief: "结合价值和策略，更稳定",
          url: "algorithms/actor-critic/index.html" }
    ],
    edges: [
        // 回归进化链
        { source: "linear-regression", target: "polynomial-regression",
          reason: "线性回归只能拟合直线" },
        { source: "linear-regression", target: "ridge-regression",
          reason: "容易过拟合" },
        { source: "linear-regression", target: "lasso-regression",
          reason: "需要特征选择" },

        // 分类进化链
        { source: "logistic-regression", target: "svm",
          reason: "需要最大间隔分类" },
        { source: "knn", target: "svm",
          reason: "KNN计算量大" },
        { source: "decision-tree", target: "random-forest",
          reason: "单棵树容易过拟合" },

        // 神经网络进化链
        { source: "nn", target: "cnn",
          reason: "需要处理图像空间结构" },
        { source: "nn", target: "rnn",
          reason: "需要处理序列数据" },
        { source: "rnn", target: "attention",
          reason: "RNN长序列梯度消失" },

        // 聚类进化链
        { source: "k-means", target: "hierarchical-clustering",
          reason: "K-Means需要预设簇数" },
        { source: "k-means", target: "dbscan",
          reason: "K-Means只能球形簇" },

        // 降维进化链
        { source: "pca", target: "lda",
          reason: "需要利用标签信息" },
        { source: "pca", target: "tsne",
          reason: "PCA是线性的，无法处理复杂结构" },

        // 强化学习进化链
        { source: "q-learning", target: "policy-gradient",
          reason: "Q表无法处理连续状态" },
        { source: "policy-gradient", target: "actor-critic",
          reason: "纯策略梯度方差大" }
    ]
};

// 进化史图谱变量
let evoSvg, evoG, evoSimulation, evoTooltip;
let currentGraphMode = 'knowledge';

// 初始化进化史图谱
function initEvolutionGraph() {
    const container = document.getElementById('evolution-graph');
    if (!container) return;

    const parent = container.parentElement;
    const width = parent.clientWidth - 40;
    const height = Math.max(500, parent.clientHeight - 40);

    // 清空容器
    d3.select('#evolution-graph').selectAll('*').remove();

    // 创建 SVG
    evoSvg = d3.select('#evolution-graph')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('min-height', height + 'px')
        .attr('viewBox', [0, 0, width, height]);

    // 创建提示框
    evoTooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // 缩放功能
    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .filter((event) => {
            if (event.type === 'wheel') {
                return event.ctrlKey || event.touches > 0;
            }
            return true;
        })
        .on('zoom', (event) => {
            evoG.attr('transform', event.transform);
        });

    evoSvg.call(zoom);

    // 创建主组
    evoG = evoSvg.append('g');

    // 准备节点数据
    const nodes = evolutionData.nodes.map(d => ({...d}));
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    // 准备边数据
    const links = evolutionData.edges.map(e => ({
        source: nodeMap[e.source],
        target: nodeMap[e.target],
        reason: e.reason
    }));

    // 按年份排序，分配初始位置
    nodes.sort((a, b) => a.year - b.year);
    const yearMin = Math.min(...nodes.map(n => n.year));
    const yearMax = Math.max(...nodes.map(n => n.year));

    nodes.forEach((d, i) => {
        // X轴按年份
        const yearRatio = (d.year - yearMin) / (yearMax - yearMin);
        d.x = 80 + yearRatio * (width - 160);
        // Y轴随机分布
        d.y = height / 2 + (Math.random() - 0.5) * (height - 200);
    });

    // 力模拟
    evoSimulation = d3.forceSimulation(nodes)
        .alphaDecay(0.02)
        .velocityDecay(0.3)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(120)
            .strength(0.3))
        .force('charge', d3.forceManyBody()
            .strength(-150)
            .distanceMax(300))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
        .force('collision', d3.forceCollide().radius(35).strength(0.8))
        .force('x', d3.forceX(d => d.x).strength(0.15));

    // 绘制边
    const link = evoG.append('g')
        .selectAll('g')
        .data(links)
        .join('g');

    // 边线
    link.append('path')
        .attr('class', 'evolution-edge')
        .attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        })
        .style('stroke', '#94a3b8')
        .style('stroke-width', 2)
        .style('fill', 'none')
        .style('marker-end', 'url(#arrow)');

    // 边标签
    link.append('text')
        .attr('class', 'evolution-edge-label')
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 8)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('fill', '#64748b')
        .text(d => d.reason.length > 8 ? d.reason.slice(0, 8) + '...' : d.reason);

    // 添加箭头定义
    evoSvg.append('defs').append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#94a3b8');

    // 绘制节点
    const node = evoG.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'evo-node')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', evoDragStarted)
            .on('drag', evoDragged)
            .on('end', evoDragEnded));

    // 节点圆形
    node.append('circle')
        .attr('r', 18)
        .style('fill', d => getEraColor(d.year))
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .on('click', function(event, d) {
            if (d.url) window.location.href = d.url;
        })
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('r', 22);

            evoTooltip.transition()
                .duration(200)
                .style('opacity', 1);
            evoTooltip.html(`
                <div class="tooltip-title">${d.name}</div>
                <div class="tooltip-year">${d.year}年</div>
                <div class="tooltip-desc">${d.brief}</div>
            `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('r', 18);
            evoTooltip.transition()
                .duration(200)
                .style('opacity', 0);
        });

    // 节点名称
    node.append('text')
        .text(d => d.name)
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('fill', '#374151')
        .style('pointer-events', 'none');

    // 年份标签
    node.append('text')
        .text(d => d.year)
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('fill', '#fff')
        .style('pointer-events', 'none');

    // 更新位置
    evoSimulation.on('tick', () => {
        link.selectAll('path')
            .attr('d', d => {
                return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
            });
        link.selectAll('text')
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2 - 8);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 添加年代图例
    const legend = evoG.append('g')
        .attr('transform', `translate(20, 20)`);

    const eras = [
        { label: '1950s前', color: '#10b981' },
        { label: '1950-1980', color: '#3b82f6' },
        { label: '1980-2000', color: '#f59e0b' },
        { label: '2000后', color: '#8b5cf6' }
    ];

    legend.selectAll('g')
        .data(eras)
        .join('g')
        .attr('transform', (d, i) => `translate(${i * 80}, 0)`)
        .call(g => {
            g.append('circle')
                .attr('r', 6)
                .attr('cx', 0)
                .attr('cy', 0)
                .style('fill', d => d.color);
            g.append('text')
                .attr('x', 12)
                .attr('y', 4)
                .style('font-size', '11px')
                .style('fill', '#64748b')
                .text(d => d.label);
        });
}

// 根据年代返回颜色
function getEraColor(year) {
    if (year < 1950) return '#10b981';
    if (year < 1980) return '#3b82f6';
    if (year < 2000) return '#f59e0b';
    return '#8b5cf6';
}

// 进化图谱拖拽函数
function evoDragStarted(event, d) {
    if (!event.active) evoSimulation.alphaTarget(0.2).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function evoDragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function evoDragEnded(event, d) {
    if (!event.active) evoSimulation.alphaTarget(0);
    setTimeout(() => {
        d.fx = null;
        d.fy = null;
    }, 100);
}

// 切换图谱模式
function switchGraphMode(mode) {
    currentGraphMode = mode;

    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // 更新视图显示
    document.getElementById('knowledge-graph').classList.toggle('active', mode === 'knowledge');
    document.getElementById('evolution-graph').classList.toggle('active', mode === 'evolution');

    // 懒加载进化图谱
    if (mode === 'evolution' && !evoSvg) {
        initEvolutionGraph();
    }
}

// 窗口大小改变时同时更新两个图谱
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        initKnowledgeGraph();
        if (currentGraphMode === 'evolution') {
            initEvolutionGraph();
        }
    }, 300);
});
