# Ice Apple Cutting Machine — Monitoring Web App

This folder is an implementation-ready planning pack and a working browser prototype for a web application that monitors ice apple (nungu) cutting, sales, stock, profit, live machine status, and kernel quality.

## Important integration boundary

**This prototype simulates the machine feed in the browser. It does not connect to or control a machine.** Automatic production counting is only feasible after the machine builder confirms the controller model, available communication method, sensor locations, signal semantics, and safe read-only access. The monitoring application must never become part of a safety or motion-control loop.

Use [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for the architecture, screen specification, database design, API contract, signal checklist, and delivery phases.

## Run the prototype

Open `index.html` in a current desktop or mobile browser. It needs no installation, server, or internet connection.

The prototype uses browser local storage. Use **Reset demo** in Settings to restore the initial sample data. The **Simulate sensor event** button shows how a validated machine count would appear; it is deliberately labeled simulation.

## Mobile use

The interface is mobile-first: phones receive a fixed five-item bottom navigation, larger touch targets, compact cards, and horizontally scrollable data tables. To make it available on a person's phone, deploy this folder to an HTTPS web host and share the resulting URL. It can then be opened in the mobile browser and, on supported phones, installed as an app from the browser menu.

The current starter has no real user-login server. A production phone login requires the planned API, authenticated user accounts, role permissions, password/OTP policy, and HTTPS hosting; it should not be simulated as a working login.

## Prototype capabilities

- Live dashboard with run/idle state, counters, output rate, quality, low-stock and integration notices
- Production count events, source labels, shifts, batches, and reject tracking
- Sales entry with payment method and automatic revenue, cost, and profit calculations
- Inventory balances and stock movement history
- Quality inspections with grade, defect reason, yield, operator, and batch link
- Responsive layout for laptop and mobile

## Proposed production implementation

| Layer | Recommended responsibility |
| --- | --- |
| Machine / PLC / sensor | Generates physical counts and health signals; owns all safe machine control |
| Edge collector | Reads approved signals, deduplicates events, buffers offline, authenticates to API |
| Web API | Validates events, stores business records, calculates summaries, publishes updates |
| PostgreSQL | Source of truth for production, sales, inventory, quality, and audit data |
| Web app | Live operational view and role-based data entry/reporting |

Suggested stack: React + TypeScript for the web app, Node.js/NestJS or FastAPI for the API, PostgreSQL, and a small industrial PC or gateway for the edge collector. The prototype intentionally uses plain HTML/CSS/JavaScript so it is easy to review before choosing a production stack.

## Before building the real connector

Obtain these items from the machine/control vendor:

1. PLC/controller make, model, firmware, and an approved read-only protocol (for example Modbus TCP, OPC UA, MQTT, or an HTTP API).
2. Exact signal list, address/tag, unit, update rate, and meaning for: unit cut, accepted output, reject, cycle start/end, run/idle/fault, emergency stop state, and downtime/fault code.
3. The counting rule: what one pulse means, whether multi-kernel fruit creates multiple outputs, and how double counts, jams, and rework are handled.
4. Network topology, permissions, IP addressing, electrical isolation, and whether an edge gateway is required.
5. Time synchronization and unique machine/event identifiers.
6. A supervised test plan that compares sensor counts against a manual count across normal and fault cases.

No machine connection should be enabled until these are documented and signed off by the responsible machine/electrical team.

## Project files

- `index.html` — working responsive dashboard prototype
- `styles.css` — visual system and responsive layout
- `app.js` — sample data, persistence, calculations, and interactions
- `IMPLEMENTATION_PLAN.md` — build-ready product/technical plan
