#!/bin/bash
# =====================================
# Claude Harness 自动 Commit 机制
# =====================================
#
# 这个脚本实现了 Coding Agent Prompt 中的 "STEP 8: COMMIT YOUR PROGRESS"
# 每个任务完成后自动 git add + 生成描述性 commit message
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_commit() {
    local msg="$1"
    echo -e "${GREEN}[COMMIT]${NC} $msg"
}

echo_info() {
    local msg="$1"
    echo -e "${YELLOW}[INFO]${NC} $msg"
}

echo_error() {
    local msg="$1"
    echo -e "${RED}[ERROR]${NC} $msg"
}

# 检查是否在 git 仓库中
if [ ! -d ".git" ]; then
    echo_error "当前目录不是 git 仓库"
    echo_info "运行: git init"
    exit 1
fi

# 获取变更的文件
CHANGED_FILES=$(git status --short | wc -l)
if [ "$CHANGED_FILES" -eq 0 ]; then
    echo_info "没有需要提交的变更"
    exit 0
fi

echo ""
echo "================================"
echo "Claude Harness - Auto Commit"
echo "================================"
echo ""

echo_commit "检测到 $CHANGED_FILES 个文件变更"
echo ""

# 显示变更文件
echo "变更文件列表："
git status --short
echo ""

# 分析变更类型
ADDED_FILES=$(git status --short | grep -c "^A" | wc -l)
MODIFIED_FILES=$(git status --short | grep -c "^ M" | wc -l)
DELETED_FILES=$(git status --short | grep -c "^ D" | wc -l)

# 收集变更信息用于生成 commit message
COMMIT_TYPE=""
FEATURE_NAME=""

# 检查 feature_list.json 获取当前任务
if [ -f ".claude/harness/feature_list.json" ]; then
    # 获取最近一个 done 状态的任务（排除 harness 任务）
    LAST_TASK=$(grep -B 2 '"mltutor-.*"status": "done"' .claude/harness/feature_list.json | head -1)
    if [ -n "$LAST_TASK" ]; then
        FEATURE_NAME=$(echo "$LAST_TASK" | grep -oP '"description": "[^"]*' | cut -d'"' -f2)
    fi
fi

# 根据 commit 类型决定 message 格式
if [ "$ADDED_FILES" -gt "$MODIFIED_FILES" ]; then
    COMMIT_TYPE="Add"
elif [ "$DELETED_FILES" -gt 0 ]; then
    COMMIT_TYPE="Remove"
else
    COMMIT_TYPE="Update"
fi

# 生成 commit message
if [ -n "$FEATURE_NAME" ]; then
    COMMIT_MSG="$COMMIT_TYPE $FEATURE_NAME"
else
    # 尝试从路径推断功能名
    MAIN_FILE=$(git status --short | head -1 | sed 's/.* //s///' | sed 's/.*\///')
    COMMIT_MSG="$COMMIT_TYPE $MAIN_FILE"
fi

# 添加 Co-Authored-By 标记
COMMIT_MSG="$COMMIT_MSG


Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

echo ""
echo_commit "生成的 Commit Message："
echo "--------------------------------"
echo "$COMMIT_MSG"
echo "--------------------------------"
echo ""

# 询问用户确认
read -p "是否使用此 commit message? (Y/n) " -n 1 -r
REPLY
if [ "$REPLY" != "Y" ] && [ "$REPLY" != "y" ]; then
    echo_info "已取消"
    exit 0
fi

# 执行 git add 和 commit
echo ""
echo_commit "执行 git add ..."
git add .

echo ""
echo_commit "执行 git commit ..."
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo_commit "提交成功！"
    echo "================================"

    # 显示 commit 信息
    echo ""
    git log -1 --stat
else
    echo ""
    echo_error "提交失败"
    exit 1
fi
