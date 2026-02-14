// Actor-Critic 可视化

const ACTIONS = ['左', '上', '右'];
let currentStep = 0;
let actorParams = [0, 0, 0]; // 每个动作的偏好
let criticValue = 0; // 状态价值估计
let learningRateActor = 0.1;
let learningRateCritic = 0.05;
let gamma = 0.9;

// 简化的环境：3个动作状态
const environment = {
    0: { // 状态 0
        actions: ['左', '上', '右'],
        rewards: [-1, 0, 1],
        transitions: [0, 1, 2]
    },
    1: { // 状态 1
        actions: ['左', '上', '右'],
        rewards: [-1, 2, -1],
        transitions: [0, 1, 2]
    },
    2: { // 状态 2
        actions: ['左', '上', '右'],
        rewards: [1, 0, -1],
        transitions: [0, 1, 2]
    }
};

let currentState = 1; // 中间状态

// 计算动作概率（Softmax）
function computePolicyProbs(state, params) {
    const scores = environment[state].actions.map((action, i) => {
        const actionIdx = ['左', '上', '右'].indexOf(action);
        return params[actionIdx];
    });

    const maxScore = Math.max(...scores);
    const expScores = scores.map(s => Math.exp(s - maxScore));
    const sumExp = expScores.reduce((a, b) => a + b, 0);

    return expScores.map(e => e / sumExp);
}

// 选择动作（采样）
function selectAction(probs) {
    const r = Math.random();
    let cumsum = 0;
    for (let i = 0; i < probs.length; i++) {
        cumsum += probs[i];
        if (r < cumsum) return i;
    }
    return probs.length - 1;
}

// 绘制 Actor 输出
function drawActorViz() {
    const container = d3.select('#actor-viz');
    container.selectAll('*').remove();

    const probs = computePolicyProbs(currentState, actorParams);

    const html = `
        <div style="margin-bottom: 10px;">
            <strong>当前状态: ${currentState}</strong>
        </div>
        <div style="display: flex; gap: 10px;">
    `;

    probs.forEach((p, i) => {
        const color = i === 0 ? '#ef4444' : i === 1 ? '#3b82f6' : '#10b981';
        const percentage = (p * 100).toFixed(1);
        html += `
            <div style="flex: 1; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 5px;">${['←', '↑', '→'][i]}</div>
                <div style="height: 8px; background: #374151; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; background: ${color}; width: ${percentage}%; transition: width 0.3s;"></div>
                </div>
                <div style="font-size: 14px; color: #9ca3af;">${percentage}%</div>
                <div style="font-size: 12px; color: #6b7280;">θ = ${actorParams[i].toFixed(2)}</div>
            </div>
        `;
    });

    html += '</div>';
    container.html(html);
}

// 绘制 Critic 输出
function drawCriticViz() {
    const container = d3.select('#critic-viz');
    container.selectAll('*').remove();

    const maxVal = 10;

    const html = `
        <div style="margin-bottom: 15px;">
            <strong>Critic 价值估计</strong>
        </div>
        <div style="display: flex; gap: 8px; align-items: flex-end; height: 120px;">
    `;

    [0, 1, 2].forEach(state => {
        const value = state === currentState ? criticValue : criticValue * 0.8;
        const height = Math.max(0, Math.min(100, (value / maxVal) * 100));
        const isCurrent = state === currentState;
        html += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: 14px; color: #9ca3af; margin-bottom: 5px;">状态 ${state}</div>
                <div style="width: 100%; height: 100%; background: #374151; border-radius: 4px 4px 4px; position: relative; overflow: hidden;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${height}%; background: ${isCurrent ? '#10b981' : '#6b7280'}; transition: all 0.3s;"></div>
                </div>
                <div style="font-size: 14px; ${isCurrent ? 'color: #10b981;' : 'color: #6b7280;'}; margin-top: 5px;">${value.toFixed(2)}</div>
            </div>
        `;
    });

    html += '</div>';
    container.html(html);
}

// 运行一步训练
function runStep() {
    if (currentStep > 0) return;

    currentStep++;

    // 1. Actor 根据当前策略选择动作
    const policy = computePolicyProbs(currentState, actorParams);
    const actionIdx = selectAction(policy);
    const action = environment[currentState].actions[actionIdx];

    // 2. 执行动作，获得奖励和下一状态
    const reward = environment[currentState].rewards[actionIdx];
    const nextState = environment[currentState].transitions[actionIdx];

    // 3. Critic 计算 TD 误差
    const nextValue = criticValue; // 简化：使用当前值估计
    const tdError = reward + gamma * nextValue - criticValue;

    // 4. 更新 Critic
    criticValue += learningRateCritic * tdError;

    // 5. 更新 Actor
    const logProb = Math.log(policy[actionIdx]);
    actorParams[actionIdx] += learningRateActor * tdError; // 简化：直接使用 TD 误差

    // 6. 更新状态
    currentState = nextState;

    // 更新显示
    const stepDiv = document.getElementById('algorithm-step');
    stepDiv.innerHTML = `
        <strong>步骤 ${currentStep}:</strong><br>
        • Actor 选择动作: <span style="color: #3b82f6;">${action}</span><br>
        • 获得奖励: <span style="color: #10b981;">${reward}</span><br>
        • TD 误差: <code>${tdError.toFixed(4)}</code><br>
        • Critic 更新价值: <code>${criticValue.toFixed(2)}</code>
    `;

    drawActorViz();
    drawCriticViz();
}

// 重置
function reset() {
    currentStep = 0;
    currentState = 1;
    actorParams = [0, 0, 0];
    criticValue = 0;
    document.getElementById('algorithm-step').textContent = '点击"运行一步"开始学习';
    drawActorViz();
    drawCriticViz();
}

// 初始化
function init() {
    document.getElementById('step-btn').addEventListener('click', runStep);
    document.getElementById('reset-btn').addEventListener('click', reset);

    drawActorViz();
    drawCriticViz();
}

document.addEventListener('DOMContentLoaded', init);
