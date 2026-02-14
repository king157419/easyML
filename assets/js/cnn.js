// CNN 卷积神经网络可视化

// 输入图像数据（5x5 网格）
const inputImages = {
    simple: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ],
    edge: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ],
    corner: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]
    ]
};

// 卷积核定义
const kernels = {
    '2': [
        [1, 0],
        [0, -1]
    ],
    '3': [
        [-1, -1, -1],
        [-1,  8, -1],
        [-1, -1, -1]
    ],
    '5': [
        [1, 0, 1, 0, 1],
        [0, 1, 2, 1, 0],
        [1, 2, 4, 2, 1],
        [0, 1, 2, 1, 0],
        [1, 0, 1, 0, 1]
    ]
};

// 当前状态
let currentImage = 'simple';
let currentKernelSize = '3';
let currentStep = 0;
let isPlaying = false;
let playInterval = null;

// DOM 元素
const inputGrid = document.getElementById('input-grid');
const kernelDisplay = document.getElementById('kernel-display');
const outputGrid = document.getElementById('output-grid');
const stepCountEl = document.getElementById('step-count');
const calcInfoEl = document.getElementById('calc-info');

// 初始化
function init() {
    renderInput();
    renderKernel();
    updateOutput();

    document.getElementById('kernel-size').addEventListener('change', (e) => {
        currentKernelSize = e.target.value;
        currentStep = 0;
        renderKernel();
        updateOutput();
    });

    document.getElementById('input-image').addEventListener('change', (e) => {
        currentImage = e.target.value;
        currentStep = 0;
        renderInput();
        updateOutput();
    });

    document.getElementById('step-btn').addEventListener('click', stepForward);
    document.getElementById('auto-btn').addEventListener('click', toggleAutoPlay);
    document.getElementById('reset-btn').addEventListener('click', reset);
}

// 渲染输入网格
function renderInput() {
    const data = inputImages[currentImage];
    inputGrid.innerHTML = '';
    data.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.background = val > 0.5 ? '#4a90d2' : '#e0e0e0';
            cell.style.width = '36px';
            cell.style.height = '36px';
            cell.style.borderRadius = '4px';
            inputGrid.appendChild(cell);
        });
    });
}

// 渲染卷积核
function renderKernel() {
    const kernel = kernels[currentKernelSize];
    const size = parseInt(currentKernelSize);
    kernelDisplay.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    kernelDisplay.innerHTML = '';

    // 计算颜色范围
    const values = kernel.flat();
    const maxVal = Math.max(...values.map(Math.abs));
    const minVal = -maxVal;

    kernel.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.width = '40px';
            cell.style.height = '40px';
            cell.style.fontWeight = 'bold';
            cell.style.fontSize = '14px';

            if (val > 0) {
                const intensity = val / maxVal;
                cell.style.background = `rgba(74, 144, 226, ${intensity})`;
                cell.style.color = 'white';
            } else if (val < 0) {
                const intensity = Math.abs(val) / maxVal;
                cell.style.background = `rgba(244, 67, 54, ${intensity})`;
                cell.style.color = 'white';
            } else {
                cell.style.background = '#e0e0e0';
                cell.style.color = '#888';
            }

            cell.textContent = val;
            kernelDisplay.appendChild(cell);
        });
    });
}

// 计算卷积输出
function convolve2D(input, kernel) {
    const inputHeight = input.length;
    const inputWidth = input[0].length;
    const kernelHeight = kernel.length;
    const kernelWidth = kernel[0].length;

    const outputHeight = inputHeight - kernelHeight + 1;
    const outputWidth = inputWidth - kernelWidth + 1;

    const output = [];
    for (let i = 0; i < outputHeight; i++) {
        output[i] = [];
        for (let j = 0; j < outputWidth; j++) {
            let sum = 0;
            for (let m = 0; m < kernelHeight; m++) {
                for (let n = 0; n < kernelWidth; n++) {
                    sum += input[i + m][j + n] * kernel[m][n];
                }
            }
            output[i][j] = sum;
        }
    }
    return output;
}

// 更新输出显示
function updateOutput() {
    const inputData = inputImages[currentImage];
    const kernel = kernels[currentKernelSize];
    const output = convolve2D(inputData, kernel);

    outputGrid.innerHTML = '';
    const size = currentKernelSize;

    if (size === '2') {
        outputGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else if (size === '3') {
        outputGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else {
        outputGrid.style.gridTemplateColumns = 'repeat(1, 1fr)';
    }

    // 计算颜色范围
    const values = output.flat();
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;

    output.forEach((row, i) => {
        row.forEach((val, j) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';

            // 根据值设置颜色
            if (val > 0) {
                const intensity = 0.2 + 0.8 * (val / maxVal);
                cell.style.background = `rgba(74, 144, 226, ${intensity})`;
            } else if (val < 0) {
                const intensity = 0.2 + 0.8 * (Math.abs(val) / Math.abs(minVal) || 0);
                cell.style.background = `rgba(244, 67, 54, ${intensity})`;
            } else {
                cell.style.background = '#e0e0e0';
            }

            cell.style.width = '50px';
            cell.style.height = '50px';
            cell.style.borderRadius = '4px';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontWeight = 'bold';
            cell.style.fontSize = '16px';
            cell.style.color = val > (maxVal + minVal) / 2 ? 'white' : '#444';
            cell.textContent = val.toFixed(0);
            outputGrid.appendChild(cell);
        });
    });

    // 更新计算说明
    const kernelSize = parseInt(currentKernelSize);
    const numMults = kernelSize * kernelSize;
    calcInfoEl.textContent = `每个输出单元格 = ${numMults} 次乘求和 | 蓝入: 5x5, 卷积核: ${kernelSize}x${kernelSize}, 输出: ${output.length}x${output[0].length}`;
}

// 单步前进（演示用）
function stepForward() {
    currentStep++;
    stepCountEl.textContent = currentStep;
    calcInfoEl.textContent = `步数: ${currentStep} - 观察卷积操作如何逐个位置计算输出值`;
}

// 切换自动播放
function toggleAutoPlay() {
    if (isPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function startAutoPlay() {
    isPlaying = true;
    document.getElementById('auto-btn').textContent = '停止';
    playInterval = setInterval(() => {
        stepForward();
        if (currentStep >= 10) {
            stopAutoPlay();
        }
    }, 1000);
}

function stopAutoPlay() {
    isPlaying = false;
    document.getElementById('auto-btn').textContent = '自动播放';
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

// 重置
function reset() {
    stopAutoPlay();
    currentStep = 0;
    stepCountEl.textContent = '0';
    calcInfoEl.textContent = '点击"单步执行"开始演示';
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);
