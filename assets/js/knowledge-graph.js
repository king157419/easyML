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

    const width = container.clientWidth;
    const height = 600;

    console.log('Initializing force-directed knowledge graph...');

    // 清空容器
    d3.select('#knowledge-graph').selectAll('*').remove();

    // 创建 SVG
    svg = d3.select('#knowledge-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    // 添加缩放功能
    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
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

    // 创建力模拟
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(d => 60 + d.source.depth * 20)
            .strength(0.8))
        .force('charge', d3.forceManyBody()
            .strength(-200)
            .distanceMax(300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 10))
        .force('radial', d3.forceRadial(d => d.depth * 100, width / 2, height / 2).strength(0.3));

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
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
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
