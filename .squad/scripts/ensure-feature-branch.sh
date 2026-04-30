#!/usr/bin/env bash
# ensure-feature-branch.sh
# Ensures we're not working directly on main branch
# If on main, auto-creates and switches to a feature branch

set -euo pipefail

get_current_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || {
        echo "❌ Error: Not in a git repository" >&2
        exit 1
    }
}

create_feature_branch() {
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local branch_name="squad/auto-${timestamp}"
    
    echo "⚠️  You are on the 'main' branch!" >&2
    echo "🔧 Auto-creating feature branch: ${branch_name}" >&2
    
    if git checkout -b "${branch_name}" >/dev/null 2>&1; then
        echo "✅ Switched to new branch: ${branch_name}" >&2
        echo "💡 You can rename it later with: git branch -m feature/your-task" >&2
        return 0
    else
        echo "❌ Failed to create feature branch" >&2
        exit 1
    fi
}

main() {
    echo "🔍 Checking current branch..." >&2
    
    local current_branch=$(get_current_branch)
    
    if [ "${current_branch}" = "main" ]; then
        create_feature_branch
    else
        echo "✅ Already on feature branch: ${current_branch}" >&2
        echo "💡 Safe to proceed with work" >&2
    fi
    
    exit 0
}

# Run main function
main
