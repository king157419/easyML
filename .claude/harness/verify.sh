#!/bin/bash
# =====================================
# Claude Harness 验证测试脚本
# =====================================
#
# 这个脚本实现了 Coding Agent Prompt 中的 "STEP 3: VERIFICATION TEST"
# 每次实现新功能前，必须先运行验证测试确保已有功能没被破坏
#

set -e

echo "================================"
echo "Claude Harness - 验证测试"
echo "================================"
echo ""

# 检查项目类型并启动服务器
if [ -f "index.html" ]; then
    echo "✅ 检测到静态 HTML 项目"

    # 尝试启动服务器（如果端口 8888 空闲）
    if ! command -v lsof 2>/dev/null | grep -q ":8888"; then
        echo ""
        echo "【验证步骤 1】启动开发服务器..."
        python -m http.server 8888 > /dev/null 2>&1 &
        SERVER_PID=$!
        echo "✅ 服务器已启动 (PID: $SERVER_PID)"
        echo "   访问 http://localhost:8888"
        echo ""

        # 等待服务器启动
        sleep 2

        # 检查服务器是否正常运行
        if curl -s http://localhost:8888 > /dev/null 2>&1; then
            echo "✅ 服务器响应正常"
            echo ""
        else
            echo "❌ 服务器启动失败"
            kill $SERVER_PID 2>/dev/null || true
            exit 1
        fi
    else
        echo "⚠️  端口 8888 已被占用，跳过启动"
        echo ""
    fi
else
    echo "❌ 未检测到 index.html，可能不是 Web 项目"
    exit 1
fi

echo "【验证步骤 2】检查核心文件完整性..."
CORE_FILES=(
    "index.html"
    "assets/css/style.css"
    "assets/css/algorithm.css"
    "assets/js/knowledge-graph.js"
)

ALL_EXISTS=true
for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo " ❌ $file (缺失)"
        ALL_EXISTS=false
    fi
done

echo ""

# 检查已实现的算法目录
IMPLEMENTED_ALGOS=(
    "algorithms/linear-regression/index.html"
    "algorithms/logistic-regression/index.html"
    "algorithms/svm/index.html"
    "algorithms/knn/index.html"
    "algorithms/nn/index.html"
)

echo "【验证步骤 3】检查已实现的算法页面..."
for algo in "${IMPLEMENTED_ALGOS[@]}"; do
    if [ -f "$algo" ]; then
        echo "  ✅ ${algo##*/}"
    else
        echo "  ❌ ${algo##*/} (缺失)"
        ALL_EXISTS=false
    fi
done

echo ""

# 检查对应的 JS 文件
echo "【验证步骤 4】检查算法 JS 文件..."
JS_FILES=(
    "assets/js/linear-regression.js"
    "assets/js/logistic-regression.js"
    "assets/js/svm.js"
    "assets/js/knn.js"
    "assets/js/nn.js"
)

for js in "${JS_FILES[@]}"; do
    if [ -f "$js" ]; then
        SIZE=$(wc -c < "$js" 2>/dev/null || echo 0)
        if [ $SIZE -gt 100 ]; then
            echo "  ✅ $js (${SIZE} bytes)"
        else
            echo "  ⚠️  $js (文件过小: ${SIZE} bytes)"
            ALL_EXISTS=false
        fi
    else
        echo "  ❌ $js (缺失)"
        ALL_EXISTS=false
    fi
done

echo ""

# 总结
echo "================================"
if [ "$ALL_EXISTS" = true ]; then
    echo "✅ 验证测试通过！所有核心组件完整。"
    echo ""
    echo "可以安全地继续新功能开发。"
else
    echo "⚠️  验证测试发现问题！"
    echo ""
    echo "请先修复上述问题再继续新功能。"
fi
echo "================================"

# 清理：如果是我们启动的服务器，询问是否关闭
if [ -n "$SERVER_PID" ]; then
    echo ""
    read -p "是否关闭开发服务器? (y/N) " -n 1
    REPLY
    if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
        echo "关闭服务器..."
        kill $SERVER_PID 2>/dev/null
        echo "✅ 服务器已关闭"
    fi
fi
