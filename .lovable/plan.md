

## Option A: localStorage Session Persistence

### What gets built
A `useSessionPersistence` custom hook that auto-saves canvassing session state to `localStorage` on every change, and on mount checks for a saved session and shows a "Resume?" prompt.

### State to persist
From `Canvassing.tsx` lines 82-109:
- `currentStep`, `volunteerInfo`, `selectedZones`, `currentZone`
- `currentStorefrontIndex`, `currentBusinessIndexWithinStorefront`
- `corrections`, `correctionsCount`, `progress`
- `volunteerData`, `internalSessionId`, `sessionId`, `sessionStartTime`, `sessionStartTimeSet`

### Files

**`src/hooks/use-session-persistence.ts`** (new)
- Defines the serializable session state shape
- `save(state)` — writes to `localStorage` under a fixed key (e.g. `wtc_canvassing_session`)
- `load()` — reads and parses saved state, returns `null` if none
- `clear()` — removes the key
- Debounced save (300ms) to avoid excessive writes

**`src/pages/Canvassing.tsx`** (modified)
- Import and use the persistence hook
- On mount: check for saved session. If found, show a "Resume previous session?" dialog before the welcome screen
- On every relevant state change: call `save()` with current state
- On session complete or explicit "Start Fresh": call `clear()`
- Add a small "Resume Session?" dialog/modal using existing Dialog component, with "Resume" and "Start Fresh" buttons

### Behavior
1. User opens page → hook checks localStorage → if saved session exists, show resume prompt
2. "Resume" → restore all state from localStorage, skip to wherever they were
3. "Start Fresh" → clear localStorage, show normal welcome
4. During canvassing → auto-save on every navigation (next/back/correction submit)
5. On session complete → clear localStorage

