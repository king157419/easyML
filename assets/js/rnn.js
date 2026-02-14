// RNN 循环神经网络可视化

const margin = {top: 20, right: 30, bottom: 20, left: 30};
const width = 800;
const height = 500;

let hiddenLayers = 2;
let neuronsPerLayer = 4;
let seqLength = 10;
let inputType = 'sine';

const svg = d3.select("#visualization svg").attr("width", width).attr("height", height).append("g");

const activations = {
    sigmoid: x => 1 / (1 + Math.exp(-x)),
    tanh: x => Math.tanh(x),
    relu: x => Math.max(0, x)
};

function initNetwork() {
    network = [];
    weights = [];
    biases = [];

    for (let i = 0; i < hiddenLayers; i++) {
        const layerWeights = [];
        const layerBiases = [];

        for (let j = 0; j < neuronsPerLayer; j++) {
            layerWeights.push((Math.random() - 0.5) * 2);
        }
        weights.push(layerWeights);
        biases.push(layerBiases);
    }
}

function forward(seq) {
    let currentState = Array(hiddenLayers).fill(0);

    for (let t = 0; t < seqLength; t++) {
        const layerInputs = [];

        for (let i = 0; i < hiddenLayers; i++) {
            const layerWeights = weights[i];
            const layerBiases = biases[i];

            for (let j = 0; j < neuronsPerLayer; j++) {
                const inputWeights = layerWeights[j];
                let sum = 0;
                for (let k = 0; k < layerWeights.length; k++) {
                    sum += currentState[k][k] * inputWeights[k];
                }
                sum += layerBiases[j];
                layerInputs.push(sum);
            }
            currentState.push(layerInputs);
        }

        // 激活函数
        const newCurrentState = [];
        for (let i = 0; i < hiddenLayers; i++) {
            const activated = currentState[i].map(activations[inputType]);
            newCurrentState.push(activated);
        }
        currentState = newCurrentState;
    }

    return currentState[hiddenLayers - 1];
}

function drawNetwork() {
    g.selectAll("*").remove();

    const layerHeight = (height - 100) / (hiddenLayers + 1);

    // 绘制连接线
    for (let i = 0; i < weights.length - 1; i++) {
        for (let j = 0; j < weights[i].length; j++) {
            g.append("line")
                .attr("x1", 400 + i * 60)
                .attr("y1", 50 + i * layerHeight)
                .attr("x2", 400 + j * 60)
                .attr("y2", 50 + i * layerHeight)
                .style("stroke", d => {
                    const colors = ["#ef4444", "#10b981", "#3b82f6"];
                    return colors[Math.floor(d * 2) % 3];
                })
                .style("stroke-width", d => 3 - d * 0.5)
                .style("opacity", 0.6);
        }
    }

    // 绘制神经元
    const neuronCount = neuronsPerLayer;
    for (let i = 0; i < weights.length; i++) {
        const y = 50 + i * layerHeight;
        for (let j = 0; j < weights[i].length; j++) {
            const x = 400 + j * 40;
            g.append("circle")
                .attr("class", "neuron")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 6)
                .style("fill", "#1f2937")
                .style("stroke", "#fff")
                .style("stroke-width", 1.5)
                .style("opacity", d => 0.7 + (j / neuronCount) * 0.3);
        }
    }

    // 绘制状态
    drawStates();

    document.getElementById("total-params").textContent = hiddenLayers * neuronsPerLayer + neuronsPerLayer + 1;
}

function drawStates() {
    g.selectAll(".state-rect").remove();

    const barHeight = 25;
    const barWidth = 15;

    states.forEach((state, t) => {
        g.append("rect")
                .attr("class", "state-rect")
                .attr("x", 400 + t * 60)
                .attr("y", margin.top + t * barHeight)
                .attr("width", barWidth)
                .attr("height", d => d.value * barHeight)
                .style("fill", d => {
                    const intensity = Math.abs(d.value);
                    return "rgba(16, 185, 129, " + intensity + ")";
                })
                .style("stroke", "#888")
                .style("stroke-width", 1);
    });

        g.append("text")
                .attr("x", 410)
                .attr("y", margin.top + t * barHeight + d.value * barHeight / 2)
                .attr("dy", "0.35em")
                .style("font-size", "12px")
                .style("fill", "#fff")
                .text(d.value.toFixed(4));
    });
}

function init() {
    document.getElementById("hidden-layers").addEventListener("input", e => {
        hiddenLayers = parseInt(e.target.value);
        document.getElementById("hidden-layers-value").textContent = hiddenLayers;
    });

    document.getElementById("neurons-per-layer").addEventListener("input", e => {
        neuronsPerLayer = parseInt(e.target.value);
        document.getElementById("neurons-per-layer-value").textContent = neuronsPerLayer;
    });

    document.getElementById("seq-length").addEventListener("input", e => {
        seqLength = parseInt(e.target.value);
        document.getElementById("seq-length-value").textContent = seqLength;
    });

    document.getElementById("input-type").addEventListener("change", () => {
        initNetwork();
        drawNetwork();
    });

    document.getElementById("step-btn").addEventListener("click", step);
    document.getElementById("play-btn").addEventListener("click", play);
    document.getElementById("reset-btn").addEventListener("click", reset);
}

document.addEventListener("DOMContentLoaded", init);
