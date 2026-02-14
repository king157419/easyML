// MLTutor - 神经网络逐层激活可视化

// 全局变量
let network = null;
let currentStep = 0;
let hiddenLayers = 2;
let neuronsPerLayer = 4;
let activation = 'relu';
let inputType = 'xor';
let inputData = [];
let targetData = [];
let activations = [];
let stepMode = false;

// D3 选择
const vizContainer = d3.select('#visualization');
let svg, g, width, height;

// 激活函数
const activationFunctions = {
    relu: x => Math.max(0, x),
    sigmoid: x => 1 / (1 + Math.exp(-x)),
    tanh: x => Math.tanh(x)
};

// 神经网络类
class NeuralNetwork {
    constructor(layers, activation) {
        this.layers = layers;
        this.activation = activation;
        this.weights = [];
        this.biases = [];

        // 初始化权重和偏置
        for (let i = 0; i < layers.length - 1; i++) {
            const w = [];
            for (let j = 0; j < layers[i + 1]; j++) {
                const row = [];
                for (let k = 0; k < layers[i]; k++) {
                    row.push((Math.random() - 0.5) * 2); // [-1, 1]
                }
                w.push(row);
            }
            this.weights.push(w);

            const b = [];
            for (let j = 0; j < layers[i + 1]; j++) {
                b.push((Math.random() - 0.5) * 0.5);
            }
            this.biases.push(b);
        }
    }

    forward(input) {
        let current = input.slice();
        const layerActivations = [current.slice()];

        for (let l = 0; l < this.weights.length; l++) {
            const next = [];
            for (let j = 0; j < this.weights[l].length; j++) {
                let sum = this.biases[l][j];
                for (let i = 0; i < current.length; i++) {
                    sum += current[i] * this.weights[l][j][i];
                }
                const activated = activationFunctions[this.activation](sum);
                next.push(activated);
            }
            current = next;
            layerActivations.push(current.slice());
        }

        return layerActivations;
    }
}

// 生成数据
function generateData(type) {
    inputData = [];
    targetData = [];

    if (type === 'xor') {
        // XOR 问题
        inputData = [
            { x1: 0, x2: 0 },
            { x1: 0, x2: 1 },
            { x1: 1, x2: 0 },
            { x1: 1, x2: 1 }
        ];
        targetData = [0, 1, 1, 0];
    } else if (type === 'circle') {
        // 圆形分类
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const label = i % 2;
            const r = label === 0 ? 0.3 : 0.7;
            inputData.push({
                x1: Math.cos(angle) * r,
                x2: Math.sin(angle) * r
            });
            targetData.push(label);
        }
    } else if (type === 'spiral') {
        // 螺旋分类
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = i / 6 * 0.8 + 0.1;
            inputData.push({
                x1: Math.cos(angle) * r,
                x2: Math.sin(angle) * r
            });
            targetData.push(i % 2);
        }
    }
}

// 初始化网络
function initNetwork() {
    const layers = [2];
    for (let i = 0; i < hiddenLayers; i++) {
        layers.push(neuronsPerLayer);
    }
    layers.push(1);

    network = new NeuralNetwork(layers, activation);
    currentStep = 0;
    activations = [];

    // 更新架构信息
    document.getElementById('hidden-layer-info').textContent =
        `${hiddenLayers} 层，每层 ${neuronsPerLayer} 个神经元`;

    // 计算总参数
    let totalWeights = 0;
    let totalBiases = 0;
    for (let i = 0; i < network.weights.length; i++) {
        totalWeights += network.weights[i].length * network.weights[i][0].length;
        totalBiases += network.biases[i].length;
    }
    document.getElementById('total-params').textContent = totalWeights;
    document.getElementById('total-biases').textContent = totalBiases;
}

// 初始化可视化
function initVisualization() {
    width = vizContainer.node().clientWidth;
    height = 500;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    vizContainer.selectAll('*').remove();

    svg = vizContainer.append('svg')
        .attr('width', width)
        .attr('height', height);

    g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // 生成数据并初始化网络
    generateData(inputType);
    initNetwork();

    renderNetwork();
}

// 渲染网络
function renderNetwork() {
    if (!network || !svg) return;

    g.selectAll('*').remove();

    const plotWidth = width - 80;
    const plotHeight = height - 80;

    // 计算每层的位置
    const layers = network.layers;
    const layerSpacing = plotWidth / (layers.length - 1);
    const layerPositions = layers.map((_, i) => ({
        x: i * layerSpacing,
        neuronCount: layers[i]
    }));

    // 计算神经元的垂直位置
    layerPositions.forEach(layer => {
        const neuronSpacing = plotHeight / (layer.neuronCount + 1);
        layer.neurons = Array.from({ length: layer.neuronCount }, (_, i) => ({
            y: (i + 1) * neuronSpacing
        }));
    });

    // 绘制连接线（权重）
    for (let l = 0; l < layers.length - 1; l++) {
        const fromLayer = layerPositions[l];
        const toLayer = layerPositions[l + 1];

        fromLayer.neurons.forEach((fromNeuron, i) => {
            toLayer.neurons.forEach((toNeuron, j) => {
                const weight = network.weights[l][j][i];
                const isActivated = l < activations.length - 1 &&
                    activations[l] && activations[l][i] > 0.1;

                g.append('line')
                    .attr('class', 'weight-line')
                    .attr('x1', fromLayer.x + 20)
                    .attr('y1', fromNeuron.y)
                    .attr('x2', toLayer.x - 20)
                    .attr('y2', toNeuron.y)
                    .style('stroke', weight > 0 ? '#10b981' : '#ef4444')
                    .style('stroke-width', Math.abs(weight) * 2)
                    .style('opacity', isActivated ? 0.8 : 0.2)
                    .style('stroke-dasharray', isActivated ? 'none' : '4,4');
            });
        });
    }

    // 绘制神经元
    layerPositions.forEach((layer, layerIndex) => {
        const layerActivation = activations[layerIndex];

        layer.neurons.forEach((neuron, neuronIndex) => {
            const activationValue = layerActivation ? layerActivation[neuronIndex] : 0;
            const isInput = layerIndex === 0;
            const hasActivation = activationValue !== undefined;

            g.append('circle')
                .attr('class', 'neuron')
                .attr('cx', layer.x)
                .attr('cy', neuron.y)
                .attr('r', isInput ? 12 : 10)
                .style('fill', hasActivation ? getActivationColor(activationValue) : '#e5e7eb')
                .style('stroke', isInput ? '#2563eb' : '#6b7280')
                .style('stroke-width', 2)
                .style('filter', hasActivation && activationValue > 0.5 ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' : 'none');

            // 显示激活值
            if (hasActivation && !isInput) {
                g.append('text')
                    .attr('x', layer.x)
                    .attr('y', neuron.y - 18)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '10px')
                    .style('fill', '#374151')
                    .text(activationValue.toFixed(2));
            }

            // 显示输入值
            if (isInput) {
                const inputLabel = neuronIndex === 0 ? 'x1' : 'x2';
                g.append('text')
                    .attr('x', layer.x - 25)
                    .attr('y', neuron.y + 4)
                    .attr('text-anchor', 'end')
                    .style('font-size', '11px')
                    .style('fill', '#374151')
                    .style('font-weight', '600')
                    .text(inputLabel);
            }
        });

        // 显示层标签
        const layerLabels = ['输入层', '隐藏层 1', '隐藏层 2', '输出层'];
        g.append('text')
            .attr('x', layer.x)
            .attr('y', plotHeight + 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#6b7280')
            .text(layerLabels[layerIndex] || `层 ${layerIndex + 1}`);
    });

    // 显示当前步数和预测
    if (activations.length > 0) {
        const output = activations[activations.length - 1][0];
        document.getElementById('step-count').textContent = `${currentStep} (输出: ${output.toFixed(3)})`;
    } else {
        document.getElementById('step-count').textContent = currentStep;
    }
}

// 获取激活值对应的颜色
function getActivationColor(value) {
    if (activation === 'relu') {
        // ReLU: 0-1 透明度
        return d3.interpolateBlues(Math.min(value, 1));
    } else if (activation === 'sigmoid') {
        // Sigmoid: 0-1 红蓝渐变
        if (value < 0.5) return d3.interpolateReds(1 - value * 2);
        return d3.interpolateBlues((value - 0.5) * 2);
    } else {
        // Tanh: -1 到 1
        const abs = Math.abs(value);
        if (value < 0) return d3.interpolateReds(abs);
        return d3.interpolateBlues(abs);
    }
}

// 单步前向传播
function stepForward() {
    if (currentStep >= inputData.length) {
        currentStep = 0;
        activations = [];
        renderNetwork();
        return;
    }

    const input = [inputData[currentStep].x1, inputData[currentStep].x2];
    activations = network.forward(input);
    currentStep++;
    renderNetwork();
}

// 完整前向传播
function fullForward() {
    activations = [];
    for (let i = 0; i < inputData.length; i++) {
        const input = [inputData[i].x1, inputData[i].x2];
        activations = network.forward([inputData[i].x1, inputData[i].x2]);
        renderNetwork();
    }
    currentStep = inputData.length;
}

// 重置
function reset() {
    currentStep = 0;
    activations = [];
    initNetwork();
    renderNetwork();
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
    initVisualization();

    // 隐藏层数
    document.getElementById('hidden-layers').addEventListener('change', (e) => {
        hiddenLayers = parseInt(e.target.value) || 2;
        reset();
    });

    // 每层神经元数
    document.getElementById('neurons-per-layer').addEventListener('change', (e) => {
        neuronsPerLayer = parseInt(e.target.value) || 4;
        reset();
    });

    // 激活函数
    document.getElementById('activation-select').addEventListener('change', (e) => {
        activation = e.target.value;
        reset();
    });

    // 输入类型
    document.getElementById('input-select').addEventListener('change', (e) => {
        inputType = e.target.value;
        generateData(inputType);
        reset();
    });

    // 单步前向
    document.getElementById('step-btn').addEventListener('click', stepForward);

    // 完整前向
    document.getElementById('forward-btn').addEventListener('click', fullForward);

    // 重置
    document.getElementById('reset-btn').addEventListener('click', reset);
});

// 窗口大小改变时重新初始化
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initVisualization, 300);
});
