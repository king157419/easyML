// 注意力机制可视化

// 示例句子和词嵌入
const sentences = {
    translation: {
        source: ["我", "爱", "机器", "学习"],
        target: ["I", "love", "machine", "learning"]
    },
    sentiment: {
        text: ["这部", "电影", "真的", "太", "好看", "了"],
        sentiment: ["中性", "中性", "中性", "强调", "积极", "强调"]
    },
    summary: {
        text: ["人工智能", "正在", "改变", "世界"],
        summary: ["AI", "改变世界"] // 简化后保留的重要词
    }
};

let currentSentence = 'translation';
let attentionType = 'additive';
let temperature = 1;
let selectedQuery = 0;

// 简化的嵌入维度
const embedDim = 8;

// 生成随机嵌入（归一化）
function generateEmbedding() {
    const embedding = [];
    for (let i = 0; i < embedDim; i++) {
        embedding.push((Math.random() - 0.5) * 2);
    }
    // L2 归一化
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    return embedding.map(v => v / norm);
}

// 创建词嵌入
let embeddings = {};
let tokens = [];

function initEmbeddings() {
    const data = sentences[currentSentence];
    tokens = data.text;
    embeddings = {};
    tokens.forEach(token => {
        embeddings[token] = generateEmbedding();
    });
}

// Additive Attention (Bahdanau)
function additiveAttention(query, keys, values, temp) {
    const scores = keys.map(key => {
        let sum = 0;
        for (let i = 0; i < embedDim; i++) {
            sum += query[i] * key[i];
        }
        // 温度缩放
        return sum / temp;
    });

    // Softmax
    const expScores = scores.map(s => Math.exp(s));
    const sumExp = expScores.reduce((s, v) => s + v, 0);
    const weights = expScores.map(s => s / sumExp);

    // 加权求和
    const result = new Array(embedDim).fill(0);
    keys.forEach((key, i) => {
        for (let j = 0; j < embedDim; j++) {
            result[j] += weights[i] * values[i][j];
        }
    });

    return { weights, result };
}

// Dot Product Attention
function dotProductAttention(query, keys, values, temp) {
    const scores = keys.map(key => {
        let dot = 0;
        for (let i = 0; i < embedDim; i++) {
            dot += query[i] * key[i];
        }
        return dot / temp;
    });

    const expScores = scores.map(s => Math.exp(s));
    const sumExp = expScores.reduce((s, v) => s + v, 0);
    const weights = expScores.map(s => s / sumExp);

    const result = new Array(embedDim).fill(0);
    keys.forEach((key, i) => {
        for (let j = 0; j < embedDim; j++) {
            result[j] += weights[i] * values[i][j];
        }
    });

    return { weights, result };
}

// Scaled Dot Product Attention
function scaledDotProductAttention(query, keys, values, temp) {
    const dk = keys[0].length; // 嵌入维度
    const scores = keys.map(key => {
        let dot = 0;
        for (let i = 0; i < embedDim; i++) {
            dot += query[i] * key[i];
        }
        return dot / (Math.sqrt(dk) * temp);
    });

    const expScores = scores.map(s => Math.exp(s));
    const sumExp = expScores.reduce((s, v) => s + v, 0);
    const weights = expScores.map(s => s / sumExp);

    const result = new Array(embedDim).fill(0);
    keys.forEach((key, i) => {
        for (let j = 0; j < embedDim; j++) {
            result[j] += weights[i] * values[i][j];
        }
    });

    return { weights, result };
}

// 计算注意力
function computeAttention(queryIdx) {
    const query = embeddings[tokens[queryIdx]];
    const keys = tokens.map(t => embeddings[t]);
    const values = tokens.map(t => embeddings[t]);

    switch (attentionType) {
        case 'additive':
            return additiveAttention(query, keys, values, temperature);
        case 'dot':
            return dotProductAttention(query, keys, values, temperature);
        case 'scaled':
            return scaledDotProductAttention(query, keys, values, temperature);
    }
}

// 绘制注意力可视化
function drawAttentionViz() {
    const container = d3.select('#attention-viz');
    container.selectAll('*').remove();

    // Token 按钮
    const tokensDiv = container.append('div').attr('class', 'token-box');

    tokens.forEach((token, i) => {
        tokensDiv.append('button')
            .attr('class', `token ${i === selectedQuery ? 'source' : ''}`)
            .text(token)
            .on('click', () => {
                selectedQuery = i;
                drawAttentionViz();
                drawAttentionMatrix();
            });
    });

    // 查询、键、值说明
    const infoDiv = container.append('div').style('margin-top: 20px; text-align: left;');
    const query = embeddings[tokens[selectedQuery]];

    infoDiv.append('div').html(`
        <div style="display: inline-block; margin-right: 15px;">
            <strong style="color: #3b82f6;">Query:</strong> "${tokens[selectedQuery]}"
        </div>
    `);

    // 注意力权重条
    const result = computeAttention(selectedQuery);
    const weightsDiv = container.append('div').attr('class', 'token-box');

    result.weights.forEach((weight, i) => {
        const bar = weightsDiv.append('div').style('width: 60px; text-align: center;');
        bar.append('div')
            .attr('class', 'embedding-bar')
            .style('width', `${weight * 100}%`)
            .style('background', i === selectedQuery ? '#3b82f6' : '#10b981');
        bar.append('span')
            .style('position: relative; top: -18px; font-size: 11px; color: #9ca3af;')
            .text((weight * 100).toFixed(1) + '%');
        bar.append('div').style('margin-top: 5px;').text(tokens[i]);
    });
}

// 绘制注意力矩阵
function drawAttentionMatrix() {
    const svg = d3.select('#attention-matrix').selectAll('*').remove();

    const size = 300;
    const cellSize = size / tokens.length;

    const svgElem = d3.select('#attention-matrix')
        .append('svg')
        .attr('width', size)
        .attr('height', size);

    // 计算完整的注意力矩阵
    const matrix = [];
    tokens.forEach((queryToken, i) => {
        matrix[i] = [];
        const query = embeddings[queryToken];
        const keys = tokens.map(t => embeddings[t]);

        const scores = keys.map(key => {
            let sum = 0;
            for (let j = 0; j < embedDim; j++) {
                sum += query[j] * key[j];
            }
            return sum / temperature;
        });

        // Softmax
        const expScores = scores.map(s => Math.exp(s));
        const sumExp = expScores.reduce((s, v) => s + v, 0);
        matrix[i] = expScores.map(s => s / sumExp);
    });

    // 绘制热力图
    const colorScale = d3.scaleSequential()
        .domain([0, 1])
        .range(['#1f2937', '#3b82f6']);

    matrix.forEach((row, i) => {
        row.forEach((value, j) => {
            svgElem.append('rect')
                .attr('x', j * cellSize)
                .attr('y', i * cellSize)
                .attr('width', cellSize - 1)
                .attr('height', cellSize - 1)
                .attr('fill', colorScale(value))
                .attr('rx', 2);

            // 标签
            svgElem.append('text')
                .attr('x', j * cellSize + cellSize / 2)
                .attr('y', i * cellSize + cellSize / 2 + 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', value > 0.5 ? '#fff' : '#9ca3af')
                .text(value.toFixed(2));
        });
    });

    // 轴标签
    tokens.forEach((token, i) => {
        svgElem.append('text')
            .attr('x', i * cellSize + cellSize / 2)
            .attr('y', size - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .text(token);
    });
}

// 更新显示
function updateDisplay() {
    document.getElementById('temperature-value').textContent = temperature.toFixed(1);
}

// 初始化
function init() {
    document.getElementById('sentence-select').addEventListener('change', e => {
        currentSentence = e.target.value;
        selectedQuery = 0;
        initEmbeddings();
        drawAttentionViz();
        drawAttentionMatrix();
    });

    document.getElementById('attention-type').addEventListener('change', e => {
        attentionType = e.target.value;
        drawAttentionViz();
        drawAttentionMatrix();
    });

    document.getElementById('temperature').addEventListener('input', e => {
        temperature = parseFloat(e.target.value);
        updateDisplay();
        drawAttentionViz();
        drawAttentionMatrix();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        temperature = 1;
        document.getElementById('temperature').value = temperature;
        initEmbeddings();
        selectedQuery = 0;
        updateDisplay();
        drawAttentionViz();
        drawAttentionMatrix();
    });

    // 初始化
    initEmbeddings();
    updateDisplay();
    drawAttentionViz();
    drawAttentionMatrix();
}

document.addEventListener('DOMContentLoaded', init);
