// Naive Bayes 分类器可视化

// D3.js 配置
const margin = {top: 20, right:  30, bottom: 20, left: 30};
const width = 800;
const height = 500;

let smoothParam = 0.5;
let errorRate = 0;

// 数据集
const datasets = {
    binary: {
        red: [[0, 0, 1, 1],     // A=0, B=0 (red)
        blue: [[0, 0, 1, 1],    // A=0, B=1 (blue)
        red: [[0, 0, 1, 1]],     // A=1, B=1 (red)
        blue: [[0, 0, 1, 1]]     // A=1, B=1 (blue)
    },
    circular: (numPoints = 60) => {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = 120 + Math.random() * 30;
            const distance = Math.random();
            // 内圆为类别0，外圆为类别1
            points.push({
                x: 250 + Math.cos(angle) * radius,
                y: 250 + Math.sin(angle) * radius,
                label: distance > 90 ? 1 : 0
            });
        }
        return points;
    }
};

let classifier = {
    red: { prior: [0.5, 0.5], likelihood: function(x) {
        return x.reduce((sum, p) => sum + (p ? 0.6 : 0.4), 0.5) / 2;
    }},
    blue: { prior: [0.5, 0.5], likelihood: function(x) {
        return x.reduce((sum, p) => sum + (p ? 0.6 : 0.4), 0.5) / 2;
    }}
};

function trainClassifier(data) {
    // 计算每个类别的概率
    const redCount = data.filter(p => p.label === 0).length;
    const blueCount = data.filter(p => p.label === 1).length;
    const totalCount = data.length;
    
    // 更新先验
    if (redCount === 0 || blueCount === 0) {
        classifier.red.prior = data.map(() => 0.5);
        classifier.blue.prior = data.map(() => 0.5);
    } else if (redCount > blueCount) {
        classifier.red.prior = data.map(() => redCount / (redCount + blueCount));
        classifier.blue.prior = data.map(() => blueCount / (redCount + blueCount));
    } else {
        // 等比例
        classifier.red.prior = data.map(() => 0.5);
        classifier.blue.prior = data.map(() => 0.5);
    }
}

// 预测
function predict(point) {
    const redLikelihood = classifier.red.likelihood(point);
    const blueLikelihood = classifier.blue.likelihood(point);
    
    if (redLikelihood >= blueLikelihood) {
        return redLikelihood;
    } else {
        return blueLikelihood;
    }
}

// 绘制数据点
function drawData() {
    g.selectAll(".data-point").remove();
    g.selectAll(".boundary-circle").remove();
    
    g.selectAll(".data-point")
        .data(datasets[datasets.circular()])
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .style("fill", d => d.label === 1 ? "#ef4444" : "#10b981")
        .style("stroke", "#fff")
        .style("opacity", 0.6);
}

    g.selectAll(".boundary-circle")
        .data(datasets[datasets.circular()])
        .enter()
        .append("circle")
        .attr("class", "boundary-circle")
        .attr("cx", 250)
        .attr("cy", 250)
        .attr("r", 122)
        .style("fill", "none")
        .style("stroke", "#cbd5e1")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0.3);
}

    const svg = d3.select("#visualization svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");
}

// 更新显示
function updateDisplay() {
    document.getElementById("smooth-param-value").textContent = smoothParam;
    
    if (smoothParam < 0.5) {
        document.getElementById("error-rate").textContent = "训练数据不足";
        errorRate = 0;
    } else {
        const correctCount = datasets.circular().filter(p => p.label === predict({x: 150, y: 150})).length;
        errorRate = ((60 - correctCount) / 60).toFixed(4);
        document.getElementById("error-rate").textContent = errorRate + "%";
    }
}

// 训练分类器
function train() {
    const datasetSelect = document.getElementById("dataset-select").value;
    const data = datasets[datasetSelect]();
    
    if (data.length === 0) return;
    
    // 训练分类器
    trainClassifier(data);
    
    // 更新误差率
    updateDisplay();
    
    // 绘制决策边界（简化版：只画一个圆作为边界）
    g.append("circle")
        .attr("cx", 250)
        .attr("cy", 250)
        .attr("r", 120)
        .style("fill", "none")
        .style("stroke", "#10b981")
        .style("stroke-width", 2);
}

function init() {
    document.getElementById("smooth-param").addEventListener("input", e => {
        smoothParam = parseFloat(e.target.value);
        document.getElementById("smooth-param-value").textContent = smoothParam;
    });

    document.getElementById("dataset-select").addEventListener("change", train);
    document.getElementById("reset-btn").addEventListener("click", () => {
        g.selectAll("*").remove();
        updateDisplay();
        document.getElementById("error-rate").textContent = "--";
        document.getElementById("smooth-param-value").textContent = "0.5";
    });
}

document.addEventListener("DOMContentLoaded", init);
