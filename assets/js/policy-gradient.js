// 策略梯度可视化

const ACTIONS = ['左', '上', '右'];
let stateValue = 0;
let policyParam = 0;
let exploration = 0.5;

// 高斯策略（连续动作）或软最大（离散动作）
function computePolicyProbs(s, theta, sigma) {
    // 计算每个动作的偏好分数
    const scores = ACTIONS.map((action, i) => {
        let score = theta;

        // 根据状态和动作计算分数
        if (action === '左') {
            score = theta + s * 0.5 - 1;
        } else if (action === '上') {
            score = theta + s * 0.3;
        } else {
            score = theta + s * 0.7 + 1;
        }

        return score;
    });

    // Softmax 转换为概率
    const maxScore = Math.max(...scores);
    const expScores = scores.map(s => Math.exp((s - maxScore) / sigma));
    const sumExp = expScores.reduce((a, b) => a + b, 0);

    return expScores.map(e => e / sumExp);
}

// 绘制策略可视化
function drawPolicyViz() {
    const svg = d3.select('#policy-viz')
        .selectAll('*')
        .remove();

    const width = 400;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };

    const svgElem = d3.select('#policy-viz')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svgElem.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 计算当前策略的概率
    const probs = computePolicyProbs(stateValue, policyParam, exploration);

    // X 轴（动作）
    const xScale = d3.scaleBand()
        .domain(ACTIONS)
        .range([0, innerWidth])
        .padding(0.3);

    // Y 轴（概率）
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerHeight, 0]);

    // 绘制网格
    g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(''));

    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

    // 标签
    svgElem.append('text')
        .attr('x', width / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text('动作概率分布');

    svgElem.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('概率');

    // 绘制柱状图
    const bars = g.selectAll('.bar')
        .data(probs)
        .enter()
        .append('g')
        .attr('class', 'bar');

    bars.append('rect')
        .attr('x', (d, i) => xScale(ACTIONS[i]))
        .attr('y', d => yScale(d))
        .attr('width', xScale.bandwidth())
        .attr('height', d => innerHeight - yScale(d))
        .attr('fill', (d, i) => i === 1 ? '#3b82f6' : i === 0 ? '#ef4444' : '#10b981')
        .attr('opacity', 0.8)
        .attr('rx', 4);

    // 添加数值标签
    bars.append('text')
        .attr('x', (d, i) => xScale(ACTIONS[i]) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#fff')
        .text(d => (d * 100).toFixed(1) + '%');

    // 更新概率信息
    const probsDiv = document.getElementById('action-probs');
    probsDiv.innerHTML = probs.map((p, i) => {
        const color = i === 1 ? '#3b82f6' : i === 0 ? '#ef4444' : '#10b981';
        return `<p style="display: inline-block; margin-right: 20px;">
            <span style="color: ${color};">●</span>
            ${ACTIONS[i]}: <code>${(p * 100).toFixed(1)}%</code>
        </p>`;
    }).join('');
}

// 更新显示
function updateDisplay() {
    document.getElementById('state-value-display').textContent = stateValue.toFixed(1);
    document.getElementById('policy-param-display').textContent = policyParam.toFixed(1);
    document.getElementById('exploration-display').textContent = exploration.toFixed(1);
}

// 初始化
function init() {
    document.getElementById('state-value').addEventListener('input', e => {
        stateValue = parseFloat(e.target.value);
        updateDisplay();
        drawPolicyViz();
    });

    document.getElementById('policy-param').addEventListener('input', e => {
        policyParam = parseFloat(e.target.value);
        updateDisplay();
        drawPolicyViz();
    });

    document.getElementById('exploration').addEventListener('input', e => {
        exploration = parseFloat(e.target.value);
        updateDisplay();
        drawPolicyViz();
    });

    // 初始绘制
    updateDisplay();
    drawPolicyViz();
}

document.addEventListener('DOMContentLoaded', init);
