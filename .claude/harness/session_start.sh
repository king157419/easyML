#!/bin/bash
# =====================================
# Coding Agent 会话启动脚本
# =====================================
#
# 这个脚本实现了 Coding Agent Prompt 中的 "STEP 1: GET YOUR BEARINGS"
# 每次新会话开始时自动运行，快速了解当前项目状态
#

HARNESS_DIR=".claude/harness"

echo "================================"
echo "Claude Harness - 会话启动"
echo "================================"
echo ""

# 1. 当前工作目录
echo "【1/7】当前工作目录:"
pwd
echo ""

# 2. 项目结构
echo "【2/7】项目结构:"
ls -la
echo ""

# 3. 读 feature_list.json
if [ -f "$HARNESS_DIR/feature_list.json" ]; then
    echo "【3/7】任务列表 (feature_list.json):"
    cat "$HARNESS_DIR/feature_list.json"
    echo ""

    # 统计任务状态
    TOTAL=$(grep -c '"id":' "$HARNESS_DIR/feature_list.json" 2>/dev/null || echo 0)
    DONE=$(grep -c '"status": "done"' "$HARNESS_DIR/feature_list.json" 2>/dev/null || echo 0)
    PENDING=$(grep -c '"status": "pending"' "$HARNESS_DIR/feature_list.json" 2>/dev/null || echo 0)

    echo "任务概要:"
    echo "  总计: $TOTAL"
    echo "  已完成: $DONE"
    echo "  待办: $PENDING"
    if [ $TOTAL -gt 0 ]; then
        PERCENT=$((DONE * 100 / TOTAL))
        echo "  完成率: $PERCENT%"
    fi
    echo ""
else
    echo "【3/7】任务列表不存在，这是首次运行，需要 Initializer Agent"
    echo ""
fi

# 4. 读 claude-progress.txt
if [ -f "$HARNESS_DIR/claude-progress.txt" ]; then
    echo "【4/7】进皮日志 (claude-progress.txt):"
    cat "$HARNESS_DIR/claude-progress.txt"
    echo ""
fi

# 5. Git 历史
if [ -d ".git" ]; then
    echo "【5/7】Git 历史 (最近 10 条):"
    git log --oneline -10 2>/dev/null || echo "Git 历史 为空"
    echo ""

    echo "【6/7】Git 状态:"
    git status --short 2>/dev/null || echo "无待提交更改"
    echo ""
else
    echo "【5/7】Git 未初始化"
    echo ""
fi

# 6. 运行 init.sh（如存在）
if [ -f "$HARNESS_DIR/init.sh" ]; then
    echo "【7/7】运行 init.sh 启动环环..."
    chmod +x "$HARNESS_DIR/init.sh"
    bash "$HARNESS_DIR/init.sh"
else
    echo "【7/7】init.sh 不存在，跳过环环启动"
fi

echo ""
echo "================================"
echo "会话启动完成！"
echo "================================"
echo ""
