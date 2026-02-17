# vibe-sync-project1

**this description below uses the help of claude (not for the system diagram)

## Overview

The Vibe-Sync Desk Companion is an interactive system designed to mitigate context-switching fatigue for students and professionals. By monitoring real-time audio data from Spotify and comparing it against scheduled commitments in Google Calendar, the system ensures that your "sonic environment" matches your cognitive load.

If the system detects a "vibe mismatch" -- such as high-energy music playing right before a deep-work study session -- it triggers a visual alert on a dashboard to help you transition smoothly between tasks.

## Key Features

- **Real-Time Monitoring**: Continuously tracks Spotify playback and upcoming calendar events
- **Intelligent Analysis**: Uses LLM-powered interpretation via Duke AI Gateway to understand music mood and task intent
- **Vibe Detection**: Identifies mismatches between sonic environment and cognitive needs
- **Proactive Alerts**: Provides visual notifications with personalized transition suggestions
- **Context Switching Support**: Helps users smoothly transition between different task types
- **Dashboard Display**: Real-time visualization of current state and recommendations

## Architecture

The system is split into three services communicating via Socket.io:

```
Python Client ──→ Node.js Server ──→ Next.js Dashboard
 (Input)           (Logic Hub)        (Visual)
```

1. **Python Client** (`python-client/`) — Polls Spotify and Google Calendar, emits data via Socket.io
2. **Node.js Server** (`node-server/`) — Receives data, calls Duke AI Gateway, evaluates alerts, broadcasts results
3. **Next.js Dashboard** (`nextjs-dashboard/`) — React dashboard that receives real-time updates via Socket.io

### Data Flow

```
Spotify API + Calendar API
          ↓
   Python Client (polls every 30s)
          ↓  (Socket.io: vibe_context / vibe_idle)
   Node.js Server
          ↓  (Duke AI Gateway analysis + alert evaluation)
          ↓  (Socket.io: vibe_update)
   Next.js Dashboard
```

## How It Works

1. **Data Extraction**: Python client polls Spotify and Google Calendar APIs every 30 seconds
2. **Data Emission**: Sends track + calendar data to Node.js server via Socket.io
3. **AI Interpretation**: Node.js server calls Duke AI Gateway to analyze compatibility
4. **Mismatch Detection**: If compatibility score < 60, system flags a mismatch with severity
5. **User Notification**: Dashboard displays color-coded alerts with transition suggestions

## The "Brain": LLM-Driven Intelligence

Rather than using hard-coded rules, Vibe-Sync employs an **LLM-driven enrichment layer** through the Duke AI Gateway:

- **The Tool**: Duke AI Gateway (secure wrapper for GPT-4)
- **The Function**: Acts as an "Interpreter" that synthesizes raw data into actionable insights
- **The Process**:
  1. Extracts metadata from Spotify and text from Google Calendar
  2. Sends data to Duke AI Gateway for contextual summarization
  3. LLM assesses music mood and task intent
  4. Generates compatibility score and transition suggestions

## Technology Stack

- **Python Client**: Python 3.x, Spotipy, Google Calendar API, python-socketio
- **Node.js Server**: Node.js, Socket.io, OpenAI SDK, Winston
- **Dashboard**: Next.js, React, TypeScript, Socket.io Client
- **APIs**: Spotify Web API, Google Calendar API, Duke AI Gateway (GPT-4)

## Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- Spotify Developer App credentials
- Google Calendar API credentials
- Duke AI Gateway API key

### Installation

```bash
# Python Client
cd python-client
pip install -r requirements.txt
# Copy credentials/ folder with google_credentials.json
# Edit .env with your Spotify credentials

# Node.js Server
cd node-server
npm install
# Edit .env with your Duke AI Gateway key

# Next.js Dashboard
cd nextjs-dashboard
npm install
```

### Running

Start services in this order:

```bash
# Terminal 1: Node.js server (start first)
cd node-server && npm start

# Terminal 2: Next.js dashboard
cd nextjs-dashboard && npm run dev

# Terminal 3: Python client
cd python-client && python main.py
```

### Running Tests

```bash
# Python Client tests
cd python-client && pytest tests/

# Node.js Server tests
cd node-server && npm test

# Next.js Dashboard tests
cd nextjs-dashboard && npm test
```

## Socket.io Event Protocol

### Python Client → Node.js Server

| Event | Payload | When |
|---|---|---|
| `vibe_idle` | `{}` | No music playing |
| `vibe_context` | `{ track: TrackInfo, events: CalendarEvent[] }` | Music playing |

### Node.js Server → Dashboard

| Event | Payload | When |
|---|---|---|
| `vibe_update` | IDLE / SYNCED / VIBE_MISMATCH | After processing |


<img width="600" height="7616" alt="image" src="https://github.com/user-attachments/assets/540463ab-0c42-4dbe-a9f1-e29c0042d2c0" />
