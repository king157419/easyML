#!/bin/bash
# =====================================
# Claude Harness 环境启动脚本
# =====================================
#
# 这个脚本由 Initializer Agent 创建，用于快速启动项目环境
# Coding Agent 每次会话开始时都应该运行此脚本
#

set -e  # 遇到错误立即退出

echo "================================"
echo "Claude Harness - 环境启动"
echo "================================"
echo ""

# 检测项目类型
PROJECT_TYPE="unknown"
if [ -f "package.json" ]; then
    PROJECT_TYPE="node"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    PROJECT_TYPE="python"
elif [ -f "go.mod" ]; then
    PROJECT_TYPE="go"
elif [ -f "Cargo.toml" ]; then
    PROJECT_TYPE="rust"
fi

echo "检测到项目类型: $PROJECT_TYPE"
echo ""

# 安装依赖（根据项目类型）
case "$PROJECT_TYPE" in
    node)
        if [ ! -d "node_modules" ]; then
            echo "安装 Node.js 依赖..."
            npm install
        fi
        ;;
    python)
        if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
            echo "创建 Python 虚拟环境..."
            python3 -m venv venv 2>/dev/null || python -m venv venv
        fi
        echo "激活虚拟环境..."
        source venv/bin/activate 2>/dev/null || source .venv/bin/activate
        if [ -f "requirements.txt" ]; then
            echo "安装 Python 依赖..."
            pip install -r requirements.txt
        fi
        ;;
    go)
        echo "安装 Go 依赖..."
        go mod download
        ;;
    rust)
        echo "检查 Cargo 构建..."
        cargo check
        ;;
esac

echo ""
echo "================================"
echo "环环启动完成！"
echo "================================"
echo ""
echo "后续步骤:"
echo "  1. 检查 .claude/harness/claude-progress.txt 了解当前进度"
echo "  2. 检查 .claude/harness/feature_list.json 查看待办任务"
echo "  3. 运行验证测试（如有定义）"
echo "  4. 开始工作"
echo ""
