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
                        { name: "多项式回归", nameEn: "Polynomial Regression", level: 3, url: "#", visualLevel: 1 },
                        { name: "Ridge 回归", nameEn: "Ridge Regression", level: 3, url: "#", visualLevel: 2 },
                        { name: "Lasso 回归", nameEn: "Lasso Regression", level: 3, url: "#", visualLevel: 2 }
                    ]
                },
                {
                    name: "分类",
                    nameEn: "Classification",
                    level: 2,
                    children: [
                        { name: "逻辑回归", nameEn: "Logistic Regression", level: 3, url: "algorithms/logistic-regression/index.html", visualLevel: 1 },
                        { name: "决策树", nameEn: "Decision Tree", level: 3, url: "#", visualLevel: 2 },
                        { name: "随机森林", nameEn: "Random Forest", level: 3, url: "#", visualLevel: 2 },
                        { name: "支持向量机", nameEn: "SVM", level: 3, url: "algorithms/svm/index.html", visualLevel: 3, highlight: true },
                        { name: "K 近邻", nameEn: "KNN", level: 3, url: "algorithms/knn/index.html", visualLevel: 1 },
                        { name: "朴素贝叶斯", nameEn: "Naive Bayes", level: 3, url: "#", visualLevel: 2 }
                    ]
                },
                {
                    name: "神经网络",
                    nameEn: "Neural Networks",
                    level: 2,
                    url: "algorithms/cnn/index.html",
                    children: [
                        { name: "前馈网络", nameEn: "Feedforward", level: 3, url: "#", visualLevel: 3 },
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
                        { name: "DBSCAN", nameEn: "DBSCAN", level: 3, url: "#", visualLevel: 2 },
                        { name: "层次聚类", nameEn: "Hierarchical", level: 3, url: "#", visualLevel: 2 }
                    ]
                },
                {
                    name: "降维",
                    nameEn: "Dimensionality Reduction",
                    level: 2,
                    children: [
                        { name: "PCA", nameEn: "PCA", level: 3, url: "algorithms/pca/index.html", visualLevel: 2 },
                        { name: "t-SNE", nameEn: "t-SNE", level: 3, url: "#", visualLevel: 2 },
                        { name: "LDA", nameEn: "LDA", level: 3, url: "#", visualLevel: 2 }
                    ]
                }
            ]
        },
        {
            name: "强化学习",
            nameEn: "Reinforcement Learning",
            level: 1,
            children: [
                { name: "Q-Learning", nameEn: "Q-Learning", level: 2, url: "#", visualLevel: 5 },
                { name: "策率梯度", nameEn: "Policy Gradient", level: 2, url: "#", visualLevel: 5 },
                { name: "Actor-Critic", nameEn: "Actor-Critic", level: 2, url: "#", visualLevel: 5 }
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

// 初始化知识图谱
function initKnowledgeGraph() {
    const container = document.getElementById('knowledge-graph');
    const width = container.clientWidth;
    const height = 500;

    // 清空容器
    d3.select('#knowledge-graph').selectAll('*').remove();

    const svg = d3.select('#knowledge-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

    // 创建树布局
    const root = d3.hierarchy().stratify()(knowledgeData);
    const treeLayout = d3.tree().size([height - 100, width - 200]);
    treeLayout(root);

    // 绘制连接线
    svg.selectAll('.link')
        .data(root.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y + 100)
            .y(d => d.x + 80))
        .style('fill', 'none')
        .style('stroke', '#cbd5e1')
        .style('stroke-width', '2px');

    // 绘制节点
    const nodes = svg.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y + 100},${d.x + 80})`);

    // 节点圆圈
    nodes.append('circle')
        .attr('r', d => {
            if (d.depth === 0) return 20;
            if (d.depth === 1) return 15;
            return 10;
        })
        .style('fill', d => {
            if (d.data.visualLevel) return levelColors[d.data.visualLevel];
            return categoryColors[d.depth];
        })
        .style('stroke', '#fff')
        .style('stroke-width', '2px')
        .style('cursor', d => d.data.url ? 'pointer' : 'default')
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
    nodes.append('text')
        .attr('dy', '0.35em')
        .attr('x', d => {
            if (d.depth === 0) return 30;
            return 18;
        })
        .style('font-size', d => {
            if (d.depth === 0) return '16px';
            if (d.depth === 1) return '14px';
            return '12px';
        })
        .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
        .style('fill', '#1f2937')
        .text(d => d.data.name);
}

// 窗口大小改变时重新绘制
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initKnowledgeGraph, 300);
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initKnowledgeGraph);

// 添加交互式缩放功能
function addZoomBehavior() {
    const svg = d3.select('#knowledge-graph svg');
    const g = svg.append('g');

    const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);
}

// 在初始化后调用
setTimeout(addZoomBehavior, 100);
