// Q-Learning 强化学习可视化

// 网格世界配置
const GRID_SIZE = 6;
const ACTIONS = ['up', 'down', 'left', 'right'];

// 环境定义
let gridWorld = [];
let startState = { x: 0, y: 0 };
let goalState = { x: 5, y: 5 };
let obstacles = [];

// Q 表
let Q = {};

// 智能体状态
let agentState = { x: 0, y: 0 };

// 超参数
let alpha = 0.1;    // 学习率
let gamma = 0.9;    // 折扣因子
let epsilon = 0.1;   // 探索率

// 训练状态
let currentEpisode = 0;
let currentStep = 0;
let totalReward = 0;
let episodeRewards = [];
let isRunning = false;
let animationSpeed = 5;
let animationId = null;

// 颜色
const colors = {
    agent: '#3b82f6',
    goal: '#10b981',
    obstacle: '#ef4444',
    start: '#8b5cf6'
};

// 初始化网格世界
function initGridWorld() {
    gridWorld = [];
    obstacles = [];

    // 创建障碍物
    obstacles = [
        { x: 2, y: 2 }, { x: 3, y: 2 },
        { x: 2, y: 3 }, { x: 3, y: 3 },
        { x: 1, y: 4 }, { x: 4, y: 1 }
    ];

    // 初始化 Q 表
    Q = {};
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            const key = `${x},${y}`;
            Q[key] = {
                up: 0, down: 0, left: 0, right: 0
            };
        }
    }
}

// 检查是否是障碍物
function isObstacle(x, y) {
    return obstacles.some(o => o.x === x && o.y === y);
}

// 检查是否是目标
function isGoal(x, y) {
    return x === goalState.x && y === goalState.y;
}

// 执行动作
function step(state, action) {
    let newState = { ...state };

    switch(action) {
        case 'up':
            newState.y = Math.max(0, state.y - 1);
            break;
        case 'down':
            newState.y = Math.min(GRID_SIZE - 1, state.y + 1);
            break;
        case 'left':
            newState.x = Math.max(0, state.x - 1);
            break;
        case 'right':
            newState.x = Math.min(GRID_SIZE - 1, state.x + 1);
            break;
    }

    // 检查障碍物
    if (isObstacle(newState.x, newState.y)) {
        return { state: state, reward: -1, done: false };
    }

    // 检查目标
    if (isGoal(newState.x, newState.y)) {
        return { state: newState, reward: 100, done: true };
    }

    // 小的负奖励鼓励尽快到达目标
    return { state: newState, reward: -0.1, done: false };
}

// 选择动作（ε-贪婪）
function chooseAction(state) {
    const key = `${state.x},${state.y}`;

    if (Math.random() < epsilon) {
        // 探索：随机选择
        return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    } else {
        // 利用：选择 Q 值最大的动作
        let bestAction = ACTIONS[0];
        let bestQ = Q[key][bestAction];

        for (const action of ACTIONS) {
            if (Q[key][action] > bestQ) {
                bestQ = Q[key][action];
                bestAction = action;
            }
        }
        return bestAction;
    }
}

// Q-Learning 更新
function updateQ(state, action, reward, nextState) {
    const key = `${state.x},${state.y}`;
    const nextKey = `${nextState.x},${nextState.y}`;

    // 找到下一个状态的最大 Q 值
    let maxNextQ = -Infinity;
    for (const a of ACTIONS) {
        if (Q[nextKey][a] > maxNextQ) {
            maxNextQ = Q[nextKey][a];
        }
    }
    if (maxNextQ === -Infinity) maxNextQ = 0;

    // 贝尔曼更新
    Q[key][action] += alpha * (reward + gamma * maxNextQ - Q[key][action]);
}

// 绘制网格世界
function drawGridWorld() {
    const container = d3.select('#grid-world');
    container.selectAll('*').remove();

    container.style('grid-template-columns', `repeat(${GRID_SIZE}, 60px)`);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = container.append('div')
                .attr('class', 'grid-cell');

            if (x === agentState.x && y === agentState.y) {
                cell.classed('agent');
                cell.append('div')
                    .attr('class', 'agent')
                    .text('🤖');
            } else if (x === goalState.x && y === goalState.y) {
                cell.classed('goal')
                    .text('★');
            } else if (isObstacle(x, y)) {
                cell.classed('obstacle')
                    .text('■');
            } else if (x === startState.x && y === startState.y) {
                cell.classed('start')
                    .text('S');
            } else {
                // 显示 Q 值箭头
                const key = `${x},${y}`;
                const maxQ = Math.max(...ACTIONS.map(a => Q[key][a]));

                ACTIONS.forEach(action => {
                    const qVal = Q[key][action];
                    if (qVal > maxQ * 0.5 && qVal > 0.01) {
                        let arrow = '';
                        let posClass = '';
                        switch(action) {
                            case 'up': arrow = '↑'; posClass = 'q-up'; break;
                            case 'down': arrow = '↓'; posClass = 'q-down'; break;
                            case 'left': arrow = '←'; posClass = 'q-left'; break;
                            case 'right': arrow = '→'; posClass = 'q-right'; break;
                        }
                        cell.append('span')
                            .attr('class', `q-values ${posClass}`)
                            .style('color', `rgba(16, 185, 129, ${Math.min(1, qVal / 10)})`)
                            .text(arrow);
                    }
                });
            }
        }
    }
}

// 绘制 Q 值热力图
function drawQHeatmap() {
    const svg = d3.select('#q-heatmap')
        .selectAll('*')
        .remove();

    const cellSize = 40;
    const size = GRID_SIZE * cellSize;

    const svgElem = d3.select('#q-heatmap')
        .append('svg')
        .attr('width', size)
        .attr('height', size);

    // 计算最大 Q 值用于归一化
    let maxQ = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (isObstacle(x, y) || isGoal(x, y)) continue;
            const key = `${x},${y}`;
            for (const action of ACTIONS) {
                maxQ = Math.max(maxQ, Q[key][action]);
            }
        }
    }

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (isObstacle(x, y) || isGoal(x, y)) continue;

            const key = `${x},${y}`;

            // 计算该状态的平均 Q 值
            const avgQ = ACTIONS.reduce((sum, a) => sum + Q[key][a], 0) / 4;

            const intensity = maxQ > 0 ? avgQ / maxQ : 0;
            const color = d3.interpolateRgb('#1f2937', '#10b981')(intensity);

            svgElem.append('rect')
                .attr('x', x * cellSize)
                .attr('y', y * cellSize)
                .attr('width', cellSize - 2)
                .attr('height', cellSize - 2)
                .attr('fill', color)
                .attr('rx', 4);

            // 添加 Q 值文本
            svgElem.append('text')
                .attr('x', x * cellSize + cellSize / 2)
                .attr('y', y * cellSize + cellSize / 2 + 4)
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('fill', intensity > 0.5 ? '#fff' : '#9ca3af')
                .text(avgQ.toFixed(1));
        }
    }

    // 颜色条
    const legendWidth = 100;
    const legendHeight = 15;
    const legend = svgElem.append('g')
        .attr('transform', `translate(${size - legendWidth - 10}, 10)`);

    const gradient = svgElem.append('defs')
        .append('linearGradient')
        .attr('id', 'q-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#1f2937');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('fill', 'url(#q-gradient)');

    legend.append('text')
        .attr('x', 0).attr('y', -5)
        .style('font-size', '10px')
        .text('低');

    legend.append('text')
        .attr('x', legendWidth).attr('y', -5)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .text('高 Q 值');
}

// 绘制学习曲线
function drawLearningCurve() {
    const svg = d3.select('#learning-curve')
        .selectAll('*')
        .remove();

    const width = 350;
    const height = 200;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

    const svgElem = d3.select('#learning-curve')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svgElem.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 数据准备
    const data = episodeRewards.map((r, i) => ({ episode: i, reward: r }));

    const xScale = d3.scaleLinear()
        .domain([0, Math.max(10, episodeRewards.length)])
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.reward).map(d => [d - 10, d + 10]))
        .range([innerHeight, 0]);

    // 网格
    g.append('g')
        .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickFormat(''));

    g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(''));

    // 坐标轴
    g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

    g.append('g')
        .call(d3.axisLeft(yScale));

    if (data.length > 1) {
        // 移动平均
        const windowSize = 5;
        const smoothed = data.map((d, i) => {
            const start = Math.max(0, i - windowSize + 1);
            const end = Math.min(data.length, i + windowSize);
            const subset = data.slice(start, end);
            const avg = subset.reduce((s, x) => s + x.reward, 0) / subset.length;
            return { episode: d.episode, reward: avg };
        });

        const line = d3.line()
            .x(d => xScale(d.episode))
            .y(d => yScale(d.reward))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(smoothed)
            .attr('fill', 'none')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2)
            .attr('d', line);
    }
}

// 更新显示
function updateDisplay() {
    document.getElementById('episode').textContent = currentEpisode;
    document.getElementById('step').textContent = currentStep;
    document.getElementById('total-reward').textContent = totalReward.toFixed(1);
    document.getElementById('alpha-value').textContent = alpha.toFixed(2);
    document.getElementById('gamma-value').textContent = gamma.toFixed(2);
    document.getElementById('epsilon-value').textContent = epsilon.toFixed(2);
    document.getElementById('speed-value').textContent = animationSpeed;
}

// 运行一个回合
async function runEpisode() {
    agentState = { ...startState };
    let episodeReward = 0;
    let steps = 0;
    const maxSteps = 100;

    while (steps < maxSteps && !isGoal(agentState.x, agentState.y)) {
        const action = chooseAction(agentState);
        const result = step(agentState, action);

        // 更新 Q 值
        updateQ(agentState, action, result.reward, result.state);

        agentState = result.state;
        episodeReward += result.reward;
        steps++;

        currentStep = steps;
        totalReward += result.reward;
        updateDisplay();
        drawGridWorld();
        drawQHeatmap();

        // 延迟
        await new Promise(resolve => {
            setTimeout(resolve, 1000 / animationSpeed);
        });
    }

    episodeRewards.push(episodeReward);
    currentEpisode++;
    currentStep = 0;
    totalReward = 0;

    drawLearningCurve();
    updateDisplay();
}

// 运行训练
async function runTraining() {
    if (isRunning) {
        isRunning = false;
        return;
    }

    isRunning = true;
    const numEpisodes = 50;

    for (let i = 0; i < numEpisodes && isRunning; i++) {
        await runEpisode();

        // 逐渐减小探索率
        epsilon = Math.max(0.01, epsilon * 0.995);
    }

    isRunning = false;
}

// 单步执行
function stepOnce() {
    const action = chooseAction(agentState);
    const result = step(agentState, action);

    updateQ(agentState, action, result.reward, result.state);
    agentState = result.state;
    totalReward += result.reward;
    currentStep++;

    if (isGoal(agentState.x, agentState.y)) {
        episodeRewards.push(totalReward);
        currentEpisode++;
        currentStep = 0;
        totalReward = 0;
        agentState = { ...startState };
        drawLearningCurve();
    }

    updateDisplay();
    drawGridWorld();
    drawQHeatmap();
}

// 重置
function reset() {
    isRunning = false;
    currentEpisode = 0;
    currentStep = 0;
    totalReward = 0;
    episodeRewards = [];
    agentState = { ...startState };
    epsilon = 0.1;

    initGridWorld();
    updateDisplay();
    drawGridWorld();
    drawQHeatmap();
    drawLearningCurve();
}

// 初始化
function init() {
    document.getElementById('alpha').addEventListener('input', e => {
        alpha = parseFloat(e.target.value);
        updateDisplay();
    });

    document.getElementById('gamma').addEventListener('input', e => {
        gamma = parseFloat(e.target.value);
        updateDisplay();
    });

    document.getElementById('epsilon').addEventListener('input', e => {
        epsilon = parseFloat(e.target.value);
        updateDisplay();
    });

    document.getElementById('speed').addEventListener('input', e => {
        animationSpeed = parseInt(e.target.value);
        updateDisplay();
    });

    document.getElementById('run-btn').addEventListener('click', runTraining);
    document.getElementById('step-btn').addEventListener('click', stepOnce);
    document.getElementById('reset-btn').addEventListener('click', reset);

    // 初始化
    initGridWorld();
    updateDisplay();
    drawGridWorld();
    drawQHeatmap();
    drawLearningCurve();
}

document.addEventListener('DOMContentLoaded', init);
