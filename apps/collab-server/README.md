# Cell Diagrams Collaboration Server

Real-time collaboration server for Cell Diagrams using Hocuspocus.

## Features

- Real-time document synchronization via WebSocket
- SQLite persistence for document storage
- Rate limiting to prevent abuse
- Graceful shutdown handling

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
PORT=1234
HOST=0.0.0.0
DATABASE_PATH=./data/collab.db
MAX_CONNECTIONS=50
THROTTLE_INTERVAL=100
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `1234` | WebSocket server port |
| `HOST` | `0.0.0.0` | Server bind address |
| `DATABASE_PATH` | `./data/collab.db` | SQLite database file path |
| `MAX_CONNECTIONS` | `50` | Maximum connections per document |
| `THROTTLE_INTERVAL` | `100` | Rate limit interval in ms |

## API

Connect to the WebSocket server at:

```
ws://localhost:1234/{documentName}
```

### Authentication

Pass a token in the connection URL:

```
ws://localhost:1234/{documentName}?token={token}
```

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod
COPY dist ./dist
EXPOSE 1234
CMD ["node", "dist/index.js"]
```

## License

MIT
