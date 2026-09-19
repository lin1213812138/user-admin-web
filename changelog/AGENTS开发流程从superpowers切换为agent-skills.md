# AGENTS.md 开发流程：superpowers → agent-skills

> 日期：2026-09-19
> 类型：决策（工作流规则变更）

## 背景

`AGENTS.md` 规则 2 原先强制「开发新功能或修复 Bug 前必须先设计，设计方案必须使用 `brainstorming` skill 完成」。其中 `brainstorming` 来自 **superpowers** 技能体系（Jesse Vincent 的 superpowers 合集，含 brainstorming / spec / plan / test-driven-development / debugging 等）。

本机已通过 junction 软链接把 **`addyosmani/agent-skills`**（25 个工程技能，位于 `E:\skills`，链接到 `~/.codebuddy/skills/`）接入 CodeBuddy，并被识别为可调用技能。因此将强制工作流从 superpowers 切换为 agent-skills。

## 决策

- 规则 2 改为：**开发必须使用 agent-skills 工作流，且先设计后编码**。
- 设计闸门用 `spec-driven-development`（等价 superpowers 的 brainstorming + spec），**用户确认 spec 后才能进入实现阶段**。
- 完整生命周期映射：
  - `using-agent-skills`（元技能，判定适用技能）
  - `spec-driven-development`（设计闸门 + 产出 spec；必要时配 `interview-me` / `idea-refine` / `source-driven-development`）
  - `planning-and-task-breakdown`（等价 superpowers 的 plan）
  - `incremental-implementation`（实现，配 `api-and-interface-design` / `frontend-ui-engineering`）
  - `test-driven-development` / `code-review-and-quality` / `browser-testing-with-devtools`（验证）
- 保留「用户确认设计之前，任何实现动作均属违规」的硬约束。
- **路径约定不变**：设计/计划文档仍落地 `docs/superpowers/specs/` 与 `docs/superpowers/plans/`（历史 60+ 篇 changelog 均引用该路径，避免大规模改写）；仅技能来源由 superpowers 改为 agent-skills。

## 实施

- 仅改 `AGENTS.md` 第 6 行（规则 2）一处，其余架构信息未动。
- 不改动 `docs/superpowers/*` 既有文档、`changelog/*` 历史记录。

## 影响

- 后续新功能/修 Bug 须在 agent-skills 工作流下推进，设计闸门以 `spec-driven-development` 产出并由用户确认。
- 团队既有 superpowers 术语（brainstorming/spec/plan）在文档中可视为 agent-skills 对应技能的别名。
