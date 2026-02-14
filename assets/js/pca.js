// PCA 主成分分析可视化

// D3.js 配置
const margin = {top: 20, right: 30, bottom: 20, left: 30};
const width = 800;
const height = 500;

let rawData = [];
let normalizedData = [];
let covarianceMatrix = [];
let eigenVectors = [];
let explainedVariance = [];
let numComponents = 2;
let totalVariance = 0;

// DOM 元素
const svg = d3.select("#visualization svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

// 生成随机二维数据（高斯分布）
function generateGaussianData(numPoints, meanX, meanY, varianceX, varianceY, covariance) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const u1 = Math.random();
        const u2 = Math.random();
        
        // Box-Muller 变换
        const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const z2 = Math.sqrt(-2 * Math.log(u2)) * Math.sin(2 * Math.PI * u2);
        
        points.push({
            x: meanX + Math.sqrt(varianceX) * z1,
            y: meanY + Math.sqrt(varianceY) * z2
        });
    }
    return points;
}

// 计算均值
function computeMean(data) {
    const n = data.length;
    return data.reduce((sum, p) => sum + p.x, 0) / n;
}

// 计算协方差
function computeCovariance(data, meanX, meanY) {
    const n = data.length;
    let covXX = 0, covXY = 0, covYY = 0;
    
    data.forEach(p => {
        covXX += (p.x - meanX) * (p.x - meanX);
        covXY += (p.x - meanX) * (p.y - meanY);
        covYY += (p.y - meanY) * (p.y - meanY);
    });
    
    return { covXX: covXX / n, covXY: covXY / n, covYY: covYY / n };
}

// 幂法求解特征值和特征向量
function eigenDecomposition(cov) {
    const n = cov.covXX.length;
    
    // 计算特征值
    const eigenvalues = [];
    for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
            sum += cov.covXX[i][j];
        }
        eigenvalues.push(sum / n);
    }
    
    // 计算特征向量
    const eigenvectors = [];
    for (let i = 0; i < n; i++) {
        const eigenvector = [];
        for (let j = 0; j < n; j++) {
            eigenvector.push(cov.covXX[j][i]);
        }
        
        // 归一化
        const norm = Math.sqrt(eigenvector.reduce((sum, val) => sum + val * val, 0));
        eigenvectors.forEach((val, idx) => {
            eigenvectors[idx] = eigenvectors[idx] / norm;
        });
        
        eigenvectors.push(eigenvector);
    }
    
    return { eigenvalues, eigenvectors };
}

// 投影数据到低维空间
function projectData(data, eigenvectors, numComponents) {
    return data.map(p => {
        let projected = 0;
        for (let i = 0; i < numComponents; i++) {
            projected += p.x * eigenvectors[i][0] + p.y * eigenvectors[i][1];
        }
        return { x: projected, y: projected, originalX: p.x, originalY: p.y };
    });
}

// 计算解释方差
function computeExplainedVariance(eigenvalues) {
    return eigenvalues.reduce((sum, val) => sum + val, 0);
}

// 绘制原始数据点
function drawRawData() {
    g.selectAll(".raw-point").remove();
    
    g.selectAll(".raw-point")
        .data(rawData)
        .enter()
        .append("circle")
        .attr("class", "raw-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .style("fill", "#888")
        .style("stroke", "#cbd5e1")
        .style("opacity", 0.5);
}

// 绘制降维后数据
function drawProjectedData() {
    g.selectAll(".projected-point").remove();
    
    g.selectAll(".projected-point")
        .data(normalizedData)
        .enter()
        .append("circle")
        .attr("class", d => "projected-point")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .style("fill", d => {
            const intensity = Math.sqrt(d.x * d.x + d.y * d.y) / 10000;
            return "rgba(74, 144, 226, " + intensity + ")";
        })
        .style("stroke", "#fff")
        .style("opacity", 0.8);
}

// 绘制主成分方向
function drawComponents() {
    g.selectAll(".component-arrow").remove();
    g.selectAll(".component-line").remove();
    
    eigenvectors.forEach((eigenvector, i) => {
        if (i >= numComponents) return;
        
        // 绘制主成分线
        g.append("line")
            .attr("class", "component-line")
            .attr("x1", 400)
            .attr("y1", 250)
            .attr("x2", 400)
            .attr("y2", 250)
            .style("stroke", d => {
                const colors = ["#ef4444", "#10b981", "#3b82f6"];
                return colors[i % 3];
            })
            .style("stroke-width", 3);
        
        // 绘制方向箭头
        const endX = 400 + eigenvector[0] * 150;
        const endY = 250 + eigenvector[1] * 150;
        
        g.append("circle")
            .attr("class", "component-arrow")
            .attr("cx", endX)
            .attr("cy", endY)
            .attr("r", 5)
            .style("fill", d => {
                const colors = ["#ef4444", "#10b981", "#3b82f6"];
                return colors[i % 3];
            });
    });
}

// 绘制原点
function drawOrigin() {
    g.selectAll(".origin").remove();
    g.append("circle")
        .attr("class", "origin")
        .attr("cx", 400)
        .attr("cy", 250)
        .attr("r", 6)
        .style("fill", "#1f2937")
        .style("stroke", "#fff")
        .style("stroke-width", 2);
}

// 计算协方差矩阵并显示
function updateCovarianceMatrix() {
    const table = document.getElementById("covariance-table");
    if (!table) return;
    
    let html = "<table style='margin: 20px; border-collapse: collapse;'>";
    html += "<tr style='background: var(--primary-color); color: white;'><th colspan='2'>Cov XX</th>";
    
    for (let i = 0; i < 2; i++) {
        html += "<tr><th style='background: var(--primary-color); color: white;'>" + i + "</th>";
        
        for (let j = 0; j < 2; j++) {
            const val = covarianceMatrix[i][j];
            html += "<td style='padding: 8px;'>" + val.toFixed(4) + "</td>";
        }
        
        html += "</tr>";
    }
    
    html += "</table>";
    table.innerHTML = html;
}

// 执行 PCA
function runPCA() {
    // 生成数据
    rawData = generateGaussianData(200, 400, 250, 2000, 1000, 0.3);
    
    // 中心化数据
    const meanX = computeMean(rawData);
    const meanY = computeMean(rawData);
    
    // 计算协方差矩阵
    covarianceMatrix = computeCovariance(rawData, meanX, meanY);
    
    // 特征分解
    const { eigenvalues, eigenvectors } = eigenDecomposition(covarianceMatrix);
    
    // 投影到低维空间
    normalizedData = projectData(rawData, eigenvectors, numComponents);
    
    // 计算解释方差
    explainedVariance = computeExplainedVariance(eigenvalues);
    totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0);
    
    // 更新显示
    document.getElementById("original-dim").textContent = "2";
    document.getElementById("reduced-dim").textContent = numComponents;
    document.getElementById("explained-variance").textContent = (explainedVariance / totalVariance * 100).toFixed(1) + "%";
    
    drawRawData();
    drawOrigin();
    drawProjectedData();
    drawComponents();
    updateCovarianceMatrix();
}

// 初始化
function init() {
    document.getElementById("sample-count").addEventListener("input", e => {
        const count = parseInt(e.target.value);
        document.getElementById("sample-count-value").textContent = count;
    });
    
    document.getElementById("num-components").addEventListener("input", e => {
        numComponents = parseInt(e.target.value);
        document.getElementById("num-components-value").textContent = numComponents;
    });
    
    document.getElementById("dataset-select").addEventListener("change", runPCA);
    document.getElementById("generate-btn").addEventListener("click", runPCA);
    
    runPCA();
}

document.addEventListener("DOMContentLoaded", init);
ENDJS
echo "PCA JS created"
