# Testing Selected Players Persistence

## Feature Description
The selected players for a game session should persist even when navigating back to Home and returning to the game session.

## Implementation Details
- Uses localStorage to store selected player IDs per session
- Storage key format: `selectedPlayers_{sessionId}`
- Automatically restores selection when returning to a session
- Validates that saved players still exist in the current session
- Falls back to all players if saved selection is invalid

## Test Steps

### Test 1: Basic Persistence
1. Start a new game session with multiple players
2. Deselect some players (leave at least 2 selected)
3. Navigate back to Home
4. Return to the game session
5. **Expected**: The same players should still be selected

### Test 2: Session Cleanup
1. Start a game session
2. Select specific players
3. End the session
4. **Expected**: localStorage entry for that session should be removed

### Test 3: Invalid Selection Handling
1. Start a session with players A, B, C
2. Select only players A and B
3. Navigate to Home
4. Remove player A from the system
5. Return to the session
6. **Expected**: Should fall back to all remaining players

### Test 4: Cross-Session Isolation
1. Create session 1 with players A, B, C
2. Select only A and B
3. End session 1
4. Create session 2 with players A, B, C, D
5. **Expected**: Session 2 should start with all players selected (not inherit from session 1)

## Console Logs to Watch
- "Restored selected players from localStorage: [...]"
- "Saved selected players to localStorage: [...]"
- "No saved selection found, using all players"
- "Saved selection invalid, using all players"

## Storage Structure
```
localStorage:
  selectedPlayers_<sessionId1>: ["playerId1", "playerId2"]
  selectedPlayers_<sessionId2>: ["playerId1", "playerId3", "playerId4"]
```
