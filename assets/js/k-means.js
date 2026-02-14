// K-Means clustering visualization
const margin = {top: 20, right: 30, bottom: 20, left: 30};
const width = 800;
const height = 500;
const dataGenerators = {
    blobs: () => {
        const points = [];
        const centers = [{ x: 200, y: 150 }, { x: 600, y: 350 }];
        for (let i = 0; i < 300; i++) {
            const center = centers[Math.floor(Math.random() * centers.length)];
            points.push({
                x: center.x + (Math.random() - 0.5) * 150,
                y: center.y + (Math.random() - 0.5) * 150,
                cluster: 0
            });
        }
        return points;
    },
    circles: () => {
        const points = [];
        for (let i = 0; i < 400; i++) {
            const angle = (i / 400) * Math.PI * 2;
            points.push({
                x: 400 + Math.cos(angle) * 120,
                y: 250 + Math.sin(angle) * 120,
                cluster: Math.floor(Math.random() * 3)
            });
        }
        return points;
    },
    moons: () => {
        const points = [];
        const centers = [{ x: 300, y: 200 }, { x: 500, y: 300 }];
        for (let i = 0; i < 400; i++) {
            const center = centers[Math.floor(Math.random() * centers.length)];
            const angle = (i / 400) * Math.PI * 2;
            const radius = 60 + Math.random() * 20;
            points.push({
                x: center.x + Math.cos(angle) * radius,
                y: center.y + Math.sin(angle) * radius,
                cluster: Math.floor(Math.random() * 3)
            });
        }
        return points;
    }
};
let data = [];
let centroids = [];
let k = 3;
let maxIterations = 20;
let iteration = 0;
let isRunning = false;
let runInterval = null;
const svg = d3.select("#visualization svg").attr("width", width).attr("height", height).append("g");
function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function kmeansStep() {
    let changed = false;
    data.forEach(point => {
        let minDist = Infinity;
        let nearest = 0;
        centroids.forEach((centroid, i) => {
            const dist = distance(point, centroid);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });
        if (point.cluster !== nearest) {
            point.cluster = nearest;
            changed = true;
        }
    });
    const newCentroids = centroids.map((centroid, i) => {
        const clusterPoints = data.filter(p => p.cluster === i);
        if (clusterPoints.length === 0) return centroid;
        const sumX = clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length;
        const sumY = clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length;
        return { x: sumX / clusterPoints.length, y: sumY / clusterPoints.length };
    });
    centroids = newCentroids;
    iteration++;
    return changed;
}
function drawPoints() {
    g.selectAll(".data-point").remove();
    g.selectAll(".data-point").data(data).enter().append("circle").attr("class", d => "data-point cluster-" + d.cluster).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", 5).style("fill", d => {
        const colors = ["#10b981", "#3b82f6", "#ef4444"];
        return colors[d.cluster % 3];
    }).style("stroke", "#fff").style("stroke-width", 1.5).style("opacity", 0.8);
}
function drawCentroids() {
    g.selectAll(".centroid").remove();
    g.selectAll(".centroid").data(centroids).enter().append("circle").attr("class", "centroid").attr("cx", d => d.x).attr("cy", d => d.y).attr("r", 10).style("fill", d => {
        const colors = ["#10b981", "#3b82f6", "#ef4444"];
        return colors[d.cluster % 3];
    }).style("stroke", "#fff").style("stroke-width", 3);
}
function drawBoundaries() {
    g.selectAll(".boundary").remove();
    centroids.forEach((d, i) => {
        g.append("circle").attr("class", "boundary").attr("cx", d.x).attr("cy", d.y).attr("r", 60).style("fill", "none").style("stroke", d => {
        const colors = ["#10b981", "#3b82f6", "#ef4444"];
        return colors[i % 3];
        }).style("stroke-width", 2).style("stroke-dasharray", "5,5").style("opacity", 0.4);
    });
}
function checkConverged() {
    const totalVariance = centroids.reduce((sum, centroid) => {
        const clusterPoints = data.filter(p => p.cluster === centroids.indexOf(centroid));
        if (clusterPoints.length === 0) return sum;
        const meanX = clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length;
        const meanY = clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length;
        const variance = clusterPoints.reduce((s, p) => s + Math.pow(p.x - meanX, 2) + Math.pow(p.y - meanY, 2), 0) / clusterPoints.length;
        return sum + variance;
    }, 0);
    const converged = iteration >= maxIterations || totalVariance < 1;
    document.getElementById("converged-status").textContent = converged ? "已收敛" : "运行中...";
    document.getElementById("final-error").textContent = converged ? "0.00" : totalVariance.toFixed(4);
    document.getElementById("cluster-variance").textContent = converged ? "0.00" : totalVariance.toFixed(4);
    return converged;
}
function step() {
    if (!checkConverged()) {
        kmeansStep();
        drawPoints();
        drawCentroids();
        drawBoundaries();
        document.getElementById("iteration-display").textContent = iteration;
    }
}
function run() {
    if (isRunning) {
        runInterval = setInterval(() => {
            if (!checkConverged()) {
                step();
            } else {
                stop();
            }
        }, 300);
    }
}
function stop() {
    isRunning = false;
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
}
function initData() {
    const generator = document.getElementById("dataset-select").value;
    data = dataGenerators[generator](400);
    centroids = [];
    iteration = 0;
    isRunning = false;
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    document.getElementById("converged-status").textContent = "运行中...";
    document.getElementById("final-error").textContent = "--";
    document.getElementById("cluster-variance").textContent = "--";
    document.getElementById("iteration-display").textContent = "0";
}
function init() {
    document.getElementById("k-value").addEventListener("input", e => {
        k = parseInt(e.target.value);
        document.getElementById("k-value-display").textContent = k;
    });
    document.getElementById("max-iterations").addEventListener("input", e => {
        maxIterations = parseInt(e.target.value);
        document.getElementById("max-iterations-display").textContent = maxIterations;
    });
    document.getElementById("dataset-select").addEventListener("change", () => {
        initData();
    });
    document.getElementById("reset-btn").addEventListener("click", resetData);
    document.getElementById("step-btn").addEventListener("click", step);
    document.getElementById("run-btn").addEventListener("click", run);
    document.getElementById("stop-btn").addEventListener("click", stop);
    initData();
}
document.addEventListener("DOMContentLoaded", init);
