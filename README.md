# SVHN — Agentic AI Platform
Access Live app at https://centrixsol.github.io/svhn/
<img width="1438" height="707" alt="Screenshot 2026-04-28 at 10 00 16 PM" src="https://github.com/user-attachments/assets/bc15ed8f-2604-4497-98f0-defe44c55552" />


> An intelligent, autonomous AI agent system designed to perceive, reason, and act — going beyond simple question-answering to complete complex, multi-step tasks end-to-end.

![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![AI](https://img.shields.io/badge/type-Agentic%20AI-blueviolet?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What is an Agentic AI Application?

Traditional AI systems respond to a single prompt and stop. An **Agentic AI** system is different — it operates autonomously across multiple steps, uses tools, makes decisions, and adapts its behavior based on intermediate results to achieve a broader goal.

Key characteristics of this system:

- **Goal-directed** — Given a high-level objective, the agent breaks it down and executes each step independently.
- **Tool use** — The agent can call external APIs, search the web, read and write files, run code, and interact with services.
- **Memory** — Maintains context across turns and tasks, building a persistent understanding of the work at hand.
- **Reasoning** — Plans before acting, evaluates results, and course-corrects when something doesn't go as expected.
- **Autonomy** — Operates with minimal human intervention, only surfacing decisions that truly require user input.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     User / Interface                │
└─────────────────────┬───────────────────────────────┘
                      │  goal / instruction
                      ▼
┌─────────────────────────────────────────────────────┐
│                   Orchestrator                      │
│   • Interprets the goal                             │
│   • Plans a sequence of actions                     │
│   • Delegates to sub-agents or tools                │
└────┬──────────────┬───────────────┬─────────────────┘
     │              │               │
     ▼              ▼               ▼
┌─────────┐   ┌──────────┐   ┌───────────┐
│  Memory │   │  Tools   │   │ Sub-agents│
│ (short  │   │ • Search │   │ • Planner │
│  & long │   │ • Code   │   │ • Executor│
│  term)  │   │ • APIs   │   │ • Reviewer│
└─────────┘   └──────────┘   └───────────┘
```

---

## Core Capabilities

| Capability | Description |
|---|---|
| **Autonomous Planning** | Decomposes complex goals into ordered, executable steps |
| **Tool Orchestration** | Invokes and chains external tools based on context |
| **Persistent Memory** | Retains facts, preferences, and prior results across sessions |
| **Self-Correction** | Detects failures, retries with adjusted strategies |
| **Multi-Agent Coordination** | Spawns and supervises specialized sub-agents in parallel |
| **Human-in-the-Loop** | Escalates ambiguous or high-risk decisions for user approval |

---

## Getting Started

### Prerequisites

- Node.js 18+ / Python 3.10+ *(depending on runtime)*
- API keys configured in `.env`

### Install

```bash
git clone https://github.com/centrixsol/SVHN.git
cd SVHN
npm install        # or: pip install -r requirements.txt
cp .env.example .env
```

### Configure

Edit `.env` with your credentials:

```env
OPENAI_API_KEY=your_key_here
# or
ANTHROPIC_API_KEY=your_key_here
```

### Run

```bash
npm start
```

---

## How It Works

1. **Receive Goal** — The user provides a high-level instruction (e.g., *"Research competitors and generate a report"*).
2. **Plan** — The orchestrator builds a step-by-step execution plan.
3. **Execute** — Each step is carried out using tools (web search, code execution, file I/O, API calls).
4. **Reflect** — After each step, the agent evaluates the result and adjusts the plan if needed.
5. **Deliver** — The final output is returned to the user along with a trace of what was done and why.

---

## Design Principles

- **Minimal footprint** — The agent only takes actions that are necessary and proportional to the task.
- **Transparency** — Every decision and tool call is logged so the user can understand what happened.
- **Safety-first** — Destructive or irreversible actions are always gated behind user confirmation.
- **Composability** — Agents and tools are modular and can be recombined for new use cases.

---

## Roadmap

- [ ] Core orchestrator loop
- [ ] Tool registry (search, code, file, API)
- [ ] Short-term and long-term memory modules
- [ ] Sub-agent spawning and coordination
- [ ] Web UI / chat interface
- [ ] Evaluation harness and benchmarks

---

## License

MIT © 2025
