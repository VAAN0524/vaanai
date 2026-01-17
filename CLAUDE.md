# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vaan Personal Website v1.0** - A modern, responsive personal homepage with a complete guestbook/message board system. The site is designed for static hosting (Cloudflare Pages) with multi-tier data storage fallback.

**Tech Stack:**
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Lucide Icons
- **Backend:** Node.js with Express.js (for local development)
- **Deployment:** Cloudflare Pages (primary), traditional Node.js server (optional)
- **Data Storage:** GitHub Issues API + localStorage + JSON file (multi-tier fallback)

## Development Commands

```bash
# One-click startup (recommended - handles all setup)
node start.js

# Install dependencies
npm install

# Development server with auto-reload
npm run dev

# Production server
npm start

# Static file serving (for frontend-only testing)
python -m http.server 8000
```

## Architecture

### Multi-Tier Data Storage

The guestbook uses a sophisticated fallback mechanism:
1. **Primary:** Express API endpoints (`/api/messages`) when server is available
2. **Secondary:** GitHub Issues API (configured in `config-helper.js`)
3. **Fallback:** localStorage for client-side persistence
4. **Default:** Hardcoded welcome messages if all else fails

### Key Components

```
index.html          # Single-page application structure
server.js           # Express server with API endpoints
start.js            # One-click initialization script
config-helper.js    # GitHub/token configuration modal
js/script.js        # Main frontend logic (ripple, messages, scroll)
js/github-sync.js   # GitHub Issues integration
js/cloudflare-sync.js # Multi-backend sync orchestration
```

### API Endpoints (server.js)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Server health check |
| `/api/messages` | GET | Fetch all messages |
| `/api/messages` | POST | Submit new message |
| `/api/debug` | GET | Debug info (dev only) |
| `/api/messages` | DELETE | Clear data (dev only) |

### Data Flow (Guestbook)

1. User submits form → `script.js` validates input (name: 20 chars, text: 500 chars)
2. `CloudflareMessageSync` attempts backends in order: server → GitHub → local
3. On success: message added to local array, rendered to DOM, persisted to localStorage
4. On page load: reverse priority - fetch from best available source

## Configuration

### GitHub Issues Backup

The site uses GitHub Issues as a database backup for static hosting:

```javascript
// Default configuration (set in config-helper.js)
token: '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'
repo: 'VAAN0524/vaanai'
```

To change: modify `config-helper.js` lines 30-31, or use the configuration modal on first load.

### Environment Detection

The codebase automatically detects:
- **localhost/127.0.0.1** → Local development mode (`http://localhost:3000`)
- **pages.dev** → Cloudflare Pages production
- **Other** → Use current origin for API calls

## Important Patterns

### Privacy Protection

- IP addresses are obfuscated (`***.***.***`)
- Location data shows only city/country (no precise coordinates)
- User-agent is stored server-side only for security
- Content filtering blocks XSS attempts (`<script>`, `javascript:`, etc.)

### Message Validation

Server-side validation in `server.js:240-273`:
- Name: required, max 20 characters
- Text: required, max 500 characters
- Forbidden words list for XSS prevention

### Frontend State Management

- `messages` array is the single source of truth
- `renderMessages()` completely re-renders the message list
- `localStorage` acts as persistence layer between sessions
- 30-second cache on GitHub API calls to reduce rate limiting

## Common Tasks

### Adding a New Section

1. Add `<section>` in `index.html` with unique ID
2. Add nav link in `.nav-menu`
3. Add corresponding styles in `css/style.css`
4. Scroll behavior is automatic via `initSmoothScroll()`

### Modifying Ripple Effect

The click ripple effect is in `js/script.js:56-135` (`initRippleSystem()`). Current scale is 4x (was 8x).

### Changing Styling Theme

Main styles in `css/style.css`. The site uses a dark theme with CSS Grid/Flexbox layouts. Search for `--progress` CSS custom properties for skill bar animations.

## Testing

No automated tests are present. Manual testing checklist:
- [ ] Guestbook submission persists across page reloads
- [ ] Character counters update correctly
- [ ] Ripple effects work on clicks (excluding interactive elements)
- [ ] Smooth scroll navigation to all sections
- [ ] Mobile responsive layout (resize browser to test)
- [ ] GitHub fallback works when server is down
