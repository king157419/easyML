// MLTutor 知识图谱 - D3.js 实现

// 知识树结构数据
const knowledgeData = {
    name: "机器学习",
    nameEn: "Machine Learning",
    level: 0,
    children: [
        {
            name: "监督学习",
            nameEn: "Supervised Learning",
            level: 1,
            children: [
                {
                    name: "回归",
                    nameEn: "Regression",
                    level: 2,
                    url: "algorithms/linear-regression/index.html",
                    children: [
                        { name: "线性回归", nameEn: "Linear Regression", level: 3, url: "algorithms/linear-regression/index.html", visualLevel: 1 },
                        { name: "多项式回归", nameEn: "Polynomial Regression", level: 3, url: "algorithms/polynomial-regression/index.html", visualLevel: 1 },
                        { name: "Ridge 回归", nameEn: "Ridge Regression", level: 3, url: "algorithms/ridge-regression/index.html", visualLevel: 2 },
                        { name: "Lasso 回归", nameEn: "Lasso Regression", level: 3, url: "algorithms/lasso-regression/index.html", visualLevel: 2 }
                    ]
                },
                {
                    name: "分类",
                    nameEn: "Classification",
                    level: 2,
                    children: [
                        { name: "逻辑回归", nameEn: "Logistic Regression", level: 3, url: "algorithms/logistic-regression/index.html", visualLevel: 1 },
                        { name: "决策树", nameEn: "Decision Tree", level: 3, url: "algorithms/decision-tree/index.html", visualLevel: 2 },
                        { name: "K-Means", nameEn: "K-Means", level: 3, url: "algorithms/k-means/index.html", visualLevel: 1 },
                        { name: "PCA", nameEn: "PCA", level: 3, url: "algorithms/pca/index.html", visualLevel: 2 },
                        { name: "随机森林", nameEn: "Random Forest", level: 3, url: "algorithms/random-forest/index.html", visualLevel: 2 },
                        { name: "支持向量机", nameEn: "SVM", level: 3, url: "algorithms/svm/index.html", visualLevel: 3, highlight: true },
                        { name: "K 近邻", nameEn: "KNN", level: 3, url: "algorithms/knn/index.html", visualLevel: 1 },
                        { name: "朴素贝叶斯", nameEn: "Naive Bayes", level: 3, url: "algorithms/naive-bayes/index.html", visualLevel: 2 },
                        { name: "RNN", nameEn: "Recurrent NN", level: 3, url: "algorithms/rnn/index.html", visualLevel: 4 },
                        { name: "随机森林", nameEn: "Random Forest", level: 3, url: "algorithms/random-forest/index.html", visualLevel: 3 }
                    ]
                },
                {
                    name: "神经网络",
                    nameEn: "Neural Networks",
                    level: 2,
                    url: "algorithms/nn/index.html",
                    children: [
                        { name: "前馈网络", nameEn: "Feedforward", level: 3, url: "algorithms/nn/index.html", visualLevel: 3 },
                        { name: "CNN", nameEn: "Convolutional NN", level: 3, url: "algorithms/cnn/index.html", visualLevel: 4 },
                        { name: "RNN", nameEn: "Recurrent NN", level: 3, url: "algorithms/rnn/index.html", visualLevel: 4 },
                        { name: "注意力机制", nameEn: "Attention", level: 3, url: "algorithms/attention/index.html", visualLevel: 4 }
                    ]
                }
            ]
        },
        {
            name: "无监督学习",
            nameEn: "Unsupervised Learning",
            level: 1,
            children: [
                {
                    name: "聚类",
                    nameEn: "Clustering",
                    level: 2,
                    children: [
                        { name: "K-Means", nameEn: "K-Means", level: 3, url: "algorithms/k-means/index.html", visualLevel: 1 },
                        { name: "DBSCAN", nameEn: "DBSCAN", level: 3, url: "algorithms/dbscan/index.html", visualLevel: 2 },
                        { name: "层次聚类", nameEn: "Hierarchical", level: 3, url: "algorithms/hierarchical-clustering/index.html", visualLevel: 2 }
                    ]
                },
                {
                    name: "降维",
                    nameEn: "Dimensionality Reduction",
                    level: 2,
                    children: [
                        { name: "PCA", nameEn: "PCA", level: 3, url: "algorithms/pca/index.html", visualLevel: 2 },
                        { name: "t-SNE", nameEn: "t-SNE", level: 3, url: "algorithms/tsne/index.html", visualLevel: 2 },
                        { name: "LDA", nameEn: "LDA", level: 3, url: "algorithms/lda/index.html", visualLevel: 2 },
                    ]
                }
            ]
        },
        {
            name: "强化学习",
            nameEn: "Reinforcement Learning",
            level: 1,
            children: [
                { name: "Q-Learning", nameEn: "Q-Learning", level: 2, url: "algorithms/q-learning/index.html", visualLevel: 5 },
                { name: "策略梯度", nameEn: "Policy Gradient", level: 2, url: "algorithms/policy-gradient/index.html", visualLevel: 5 },
                { name: "Actor-Critic", nameEn: "Actor-Critic", level: 2, url: "algorithms/actor-critic/index.html", visualLevel: 5 }
            ]
        }
    ]
};

// 颜色映射（按可视化等级）
const levelColors = {
    1: "#10b981",  // 绿色 - 直观可画
    2: "#3b82f6",  // 蓝色 - 决策结构
    3: "#f59e0b",  // 橙色 - 交互式理解
    4: "#ef4444",  // 红色 - 深度学习
    5: "#8b5cf6"   // 紫色 - 概念隐喻
};

const categoryColors = {
    0: "#2563eb",  // 根节点
    1: "#7c3aed",  // 一级分类
    2: "#06b6d4"   // 二级分类
};

// D3 v7 cluster layout helper
function buildHierarchy(root) {
    // 给每个节点添加 depth 属性
    function assignDepth(node, depth) {
        node.depth = depth;
        if (node.children) {
            node.children.forEach(child => assignDepth(child, depth + 1));
        }
    }

    assignDepth(root, 0);

    // 计算每个节点的位置
    const levels = {};

    function calculatePositions(node) {
        const depth = node.depth;
        if (!levels[depth]) levels[depth] = [];
        levels[depth].push(node);

        if (node.children) {
            node.children.forEach(child => calculatePositions(child));
        }
    }

    calculatePositions(root);

    // 设置 X, Y 坐标
    const levelHeight = 70;
    const nodeSpacing = 60;

    Object.keys(levels).forEach(depth => {
        const count = levels[depth].length;
        const totalWidth = count * nodeSpacing;
        const startX = -(totalWidth / 2) + (nodeSpacing / 2);

        levels[depth].forEach((node, i) => {
            node.x = startX + i * nodeSpacing;
            node.y = depth * levelHeight;
        });
    });

    return root;
}

// 绘制连接线
function drawLinks(svg, root) {
    svg.selectAll('.link').remove();

    const links = [];
    function collectLinks(node) {
        if (node.children) {
            node.children.forEach(child => {
                links.push({ source: node, target: child });
                collectLinks(child);
            });
        }
    }

    collectLinks(root);

    svg.selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d => {
            return `M${d.source.x},${d.source.y}L${(d.source.x + d.target.x) / 2},${(d.source.y + d.target.y) / 2}`;
        })
        .style('fill', 'none')
        .style('stroke', '#cbd5e1')
        .style('stroke-width', '2px');
}

// 绘制节点
function drawNodes(svg, root) {
    svg.selectAll('.node').remove();
    svg.selectAll('.node circle').remove();
    svg.selectAll('.node text').remove();

    const nodes = root.descendants();

    svg.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    // 节点圆圈
    svg.selectAll('.node')
        .append('circle')
        .attr('r', d => {
            if (d.depth === 0) return 18;
            if (d.depth === 1) return 14;
            if (d.depth === 2) return 11;
            return 8;
        })
        .style('fill', d => {
            if (d.data.visualLevel) return levelColors[d.data.visualLevel];
            return categoryColors[d.depth];
        })
        .style('stroke', '#fff')
        .style('stroke-width', '2px')
        .style('cursor', d => d.data.url && d.data.url !== '#' ? 'pointer' : 'default')
        .style('filter', d => d.data.highlight ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))' : 'none')
        .on('click', function(event, d) {
            if (d.data.url && d.data.url !== '#') {
                window.location.href = d.data.url;
            }
        })
        .on('mouseover', function(event, d) {
            if (d.data.url && d.data.url !== '#') {
                d3.select(this).style('opacity', '0.7');
            }
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', '1');
        });

    // 节点标签
    svg.selectAll('.node')
        .append('text')
        .attr('dy', '0.35em')
        .attr('x', d => {
            if (d.depth === 0) return 28;
            if (d.depth === 1) return 18;
            return 12;
        })
        .style('font-size', d => {
            if (d.depth === 0) return '15px';
            if (d.depth === 1) return '13px';
            return '11px';
        })
        .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
        .style('fill', '#1f2937')
        .text(d => d.data.name);
}

// 初始化知识图谱
function initKnowledgeGraph() {
    const container = document.getElementById('knowledge-graph-container');
    if (!container) {
        console.error('Knowledge graph container not found!');
        return;
    }

    const width = Math.max(800, container.clientWidth - 40);
    const height = 600;

    console.log('Initializing knowledge graph with D3 version:', d3.version);

    // 清空容器
    d3.select('#knowledge-graph-container').selectAll('*').remove();

    // 创建 SVG
    const svg = d3.select('#knowledge-graph-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // 构建层次结构并计算坐标
    const root = d3.hierarchy(knowledgeData);
    const layoutRoot = buildHierarchy(root);

    // 绘制连接线
    drawLinks(svg, layoutRoot);

    // 绘制节点
    drawNodes(svg, layoutRoot);

    console.log('Knowledge graph rendered with', root.descendants().length, 'nodes');
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
