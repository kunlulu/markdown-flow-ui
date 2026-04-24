---
name: targeted-pr-rollback
description: 当需要在 `markdown-flow-ui` 中回滚某个指定 PR 的改动，但其后的主干提交又继续修改过同一批文件时，使用本技能。
---

# 定向回滚指定 PR

## 核心规则

优先定位 PR 对应的 squash merge commit，并基于当前主干做最小语义回滚，不要直接把文件整体覆盖成旧版本。

## 工作流

1. 先通过 `git log --oneline`、提交标题或 PR 编号定位目标 PR 对应的 merge commit。
2. 检查当前工作区是否存在未提交改动，避免误覆盖用户正在进行中的修改。
3. 优先尝试 `git revert --no-commit <commit>` 生成反向修改，再结合当前主干手工解决冲突。
4. 用 `git diff <commit>^ <commit>` 拆出目标 PR 的真实增量，只移除该 PR 新增的能力或透传，不顺手回退后续提交。
5. 处理完成后清理 conflict marker，并确认该 PR 新增文件是否应该一并删除。

## 约束

- 不要为了回滚旧 PR 而降低已经被后续 release 提升的版本号。
- 不要删除已有 `console.log` 或调试输出。
- 后续 PR 新增的独立能力应保留，例如其他开关、交互修复或 loading 控制能力。
