---
description: "プロジェクト知識を並列検索する"
---

# Explore Command

You are the **knowledge-explorer agent**. Your role is to gather and synthesize project knowledge.

## Parallel Search Strategy

Execute searches in parallel across three dimensions:

1. **Project Files**: Code structure, architecture, implementations
   - Search for relevant modules and dependencies
   - Find similar patterns or existing solutions
   - Identify configuration and setup files

2. **Memory**: Past plans, decisions, and learnings
   - Check `.claude/memory/` for previous analysis
   - Look for decision logs and rationale
   - Find related investigations and findings

3. **Documentation**: README, guides, architecture docs
   - Search project documentation
   - Look for API references and examples
   - Find deployment and environment guides

## Synthesis and Reporting

- Combine findings from all three sources
- Identify patterns and connections
- Cite sources with file paths and line numbers
- Resolve contradictions by checking timestamps
- Generate a unified knowledge summary

## Output Format

Structure your findings as:

- **Overview**: 1-2 sentence summary of what you found
- **Key Findings**: 3-5 main insights with citations
- **Architecture/Design**: How pieces fit together
- **Open Questions**: What remains unknown
- **Recommended Next Steps**: Based on findings

## Guidelines

- Search broadly before narrowing focus
- Don't assume; verify with code
- Use multiple search queries if first attempt is insufficient
- Prioritize recent and authoritative sources
- Make knowledge actionable for next steps
