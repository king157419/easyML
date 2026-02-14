// RNN 循环神经网络可视化

const margin = {top: 20, right: 30, bottom: 20, left: 30};
const width = 800;
const height = 450;

let hiddenLayers = 2;
let neuronsPerLayer = 4;
let seqLength = 10;
let inputType = 'sine';
let currentStep = 0;
let isPlaying = false;
let playInterval = null;

let svg, g;
let states = [];
let weights = [];
let sequence = [];

// 激活函数
const activations = {
    sigmoid: x => 1 / (1 + Math.exp(-x)),
    tanh: x => Math.tanh(x),
    relu: x => Math.max(0, x)
};

// 生成输入序列
function generateSequence(type, length) {
    const seq = [];
    for (let t = 0; t < length; t++) {
        const val = type === 'sine'
            ? Math.sin(t * 0.5)
            : Math.cos(t * 0.5);
        seq.push(val);
    }
    return seq;
}

// 初始化网络权重
function initNetwork() {
    weights = [];
    states = [];

    // 简化的 RNN: 每层有权重
    for (let i = 0; i < hiddenLayers; i++) {
        const layerWeights = [];
        for (let j = 0; j < neuronsPerLayer; j++) {
            layerWeights.push({
                w: (Math.random() - 0.5) * 2,
                u: (Math.random() - 0.5) * 2,  // 循环权重
                b: (Math.random() - 0.5)
            });
        }
        weights.push(layerWeights);
    }

    // 初始状态
    for (let t = 0; t < seqLength; t++) {
        states.push(Array(hiddenLayers).fill(null).map(() =>
            Array(neuronsPerLayer).fill(0)
        ));
    }

    sequence = generateSequence(inputType, seqLength);
    currentStep = 0;
}

// 前向传播一步
function forwardStep(t) {
    const prevState = t > 0 ? states[t - 1] : Array(hiddenLayers).fill(null).map(() =>
        Array(neuronsPerLayer).fill(0)
    );

    for (let i = 0; i < hiddenLayers; i++) {
        for (let j = 0; j < neuronsPerLayer; j++) {
            const w = weights[i][j];
            let sum = w.b;
            sum += sequence[t] * w.w;  // 输入
            sum += prevState[i][j] * w.u;  // 循环连接
            states[t][i][j] = activations.tanh(sum);
        }
    }
}

// 绘制网络
function drawNetwork() {
    g.selectAll("*").remove();

    const layerSpacing = 120;
    const neuronSpacing = 35;
    const startX = 150;

    // 绘制时间步指示
    g.append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`时间步 t = ${currentStep} / ${seqLength}`);

    // 绘制输入节点
    const inputX = startX - 80;
    g.append("circle")
        .attr("cx", inputX)
        .attr("cy", height / 2)
        .attr("r", 20)
        .style("fill", "#3b82f6")
        .style("stroke", "#1e40af")
        .style("stroke-width", 2);
    g.append("text")
        .attr("x", inputX)
        .attr("y", height / 2 + 5)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-size", "12px")
        .text(currentStep > 0 ? sequence[currentStep - 1].toFixed(2) : "-");

    // 绘制隐藏层
    for (let i = 0; i < hiddenLayers; i++) {
        const x = startX + i * layerSpacing;

        // 层标签
        g.append("text")
            .attr("x", x)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(`隐藏层 ${i + 1}`);

        // 神经元
        for (let j = 0; j < neuronsPerLayer; j++) {
            const y = 100 + j * neuronSpacing + (height - 100 - neuronsPerLayer * neuronSpacing) / 2;

            // 获取当前状态值
            const stateVal = currentStep > 0 ? states[currentStep - 1][i][j] : 0;
            const intensity = Math.abs(stateVal);

            // 神经元圆形
            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 12)
                .style("fill", stateVal >= 0
                    ? `rgba(16, 185, 129, ${0.3 + intensity * 0.7})`
                    : `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`)
                .style("stroke", "#fff")
                .style("stroke-width", 2);

            // 状态值文本
            g.append("text")
                .attr("x", x)
                .attr("y", y + 4)
                .attr("text-anchor", "middle")
                .style("font-size", "10px")
                .style("fill", intensity > 0.5 ? "#fff" : "#1f2937")
                .text(stateVal.toFixed(2));

            // 从输入到第一层的连接
            if (i === 0) {
                g.append("line")
                    .attr("x1", inputX + 20)
                    .attr("y1", height / 2)
                    .attr("x2", x - 12)
                    .attr("y2", y)
                    .style("stroke", "#cbd5e1")
                    .style("stroke-width", 1.5)
                    .style("opacity", 0.5);
            }

            // 层间连接
            if (i > 0) {
                const prevX = startX + (i - 1) * layerSpacing;
                for (let pj = 0; pj < neuronsPerLayer; pj++) {
                    const prevY = 100 + pj * neuronSpacing + (height - 100 - neuronsPerLayer * neuronSpacing) / 2;
                    g.append("line")
                        .attr("x1", prevX + 12)
                        .attr("y1", prevY)
                        .attr("x2", x - 12)
                        .attr("y2", y)
                        .style("stroke", "#cbd5e1")
                        .style("stroke-width", 1)
                        .style("opacity", 0.3);
                }
            }
        }
    }

    // 绘制循环连接（虚线）
    for (let i = 0; i < hiddenLayers; i++) {
        const x = startX + i * layerSpacing;
        const nextX = x + 60;

        // 循环箭头
        g.append("path")
            .attr("d", `M ${x + 12} ${height - 40} Q ${nextX} ${height - 20} ${x - 12} ${height - 40}`)
            .style("fill", "none")
            .style("stroke", "#8b5cf6")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,3")
            .style("opacity", 0.7);

        g.append("text")
            .attr("x", x)
            .attr("y", height - 15)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "#8b5cf6")
            .text("循环 h(t-1)→h(t)");
    }

    // 绘制输出节点
    const outputX = startX + hiddenLayers * layerSpacing;
    g.append("circle")
        .attr("cx", outputX)
        .attr("cy", height / 2)
        .attr("r", 20)
        .style("fill", "#f59e0b")
        .style("stroke", "#d97706")
        .style("stroke-width", 2);
    g.append("text")
        .attr("x", outputX)
        .attr("y", height / 2 + 5)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-size", "12px")
        .text("y");

    // 连接到输出
    const lastLayerX = startX + (hiddenLayers - 1) * layerSpacing;
    for (let j = 0; j < neuronsPerLayer; j++) {
        const y = 100 + j * neuronSpacing + (height - 100 - neuronsPerLayer * neuronSpacing) / 2;
        g.append("line")
            .attr("x1", lastLayerX + 12)
            .attr("y1", y)
            .attr("x2", outputX - 20)
            .attr("y2", height / 2)
            .style("stroke", "#cbd5e1")
            .style("stroke-width", 1)
            .style("opacity", 0.5);
    }

    // 更新信息显示
    const totalParams = hiddenLayers * neuronsPerLayer * 3;
    document.getElementById("total-params").textContent = totalParams;
    document.getElementById("step-count").textContent = currentStep;
    document.getElementById("total-steps").textContent = seqLength;
}

// 单步执行
function step() {
    if (currentStep < seqLength) {
        forwardStep(currentStep);
        currentStep++;
        drawNetwork();
    }
}

// 播放
function play() {
    if (isPlaying) {
        isPlaying = false;
        clearInterval(playInterval);
        document.getElementById("play-btn").textContent = "播放序列";
        return;
    }

    isPlaying = true;
    document.getElementById("play-btn").textContent = "暂停";

    playInterval = setInterval(() => {
        if (currentStep >= seqLength) {
            clearInterval(playInterval);
            isPlaying = false;
            document.getElementById("play-btn").textContent = "播放序列";
            return;
        }
        step();
    }, 500);
}

// 重置
function reset() {
    clearInterval(playInterval);
    isPlaying = false;
    document.getElementById("play-btn").textContent = "播放序列";
    initNetwork();
    drawNetwork();
}

// 初始化
function init() {
    // 创建 SVG
    svg = d3.select("#visualization")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    g = svg.append("g");

    // 背景
    g.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f8f9fa")
        .attr("rx", 8);

    // 事件监听
    document.getElementById("hidden-layers").addEventListener("input", e => {
        hiddenLayers = parseInt(e.target.value);
        reset();
    });

    document.getElementById("neurons-per-layer").addEventListener("input", e => {
        neuronsPerLayer = parseInt(e.target.value);
        reset();
    });

    document.getElementById("seq-length").addEventListener("input", e => {
        seqLength = parseInt(e.target.value);
        document.getElementById("seq-length-value").textContent = seqLength;
        reset();
    });

    document.getElementById("input-type").addEventListener("change", e => {
        inputType = e.target.value;
        reset();
    });

    document.getElementById("step-btn").addEventListener("click", step);
    document.getElementById("play-btn").addEventListener("click", play);
    document.getElementById("reset-btn").addEventListener("click", reset);

    // 初始化
    initNetwork();
    drawNetwork();
}

document.addEventListener("DOMContentLoaded", init);
