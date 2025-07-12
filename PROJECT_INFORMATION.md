
# Game Points Tracking App

A real-time game points tracking app with these features:

## Players & Sessions

- Define a master list of players by name.
- Start a game session by selecting participating players from the list; prompt only if none selected.
- Each session tracks a series of games.

## Points Management
- All players start at 0 points per session.
- After each game, input points for each participating player except one; the remaining player’s points auto-calculate as the negative sum of others’ points.
- Provide an option to disable auto-calculation, allowing manual point edits.

## Interface

- Display each player’s current total points prominently for quick overview.
- Show a clear, scrollable history of points per game below the totals or in specific tab.
- At session end, present final results sorted by lowest points first (loser on top).

## Design & UX

- Minimal, intuitive interface with easy navigation.
- Responsive layout for all devices.
- Clear feedback on actions and seamless real-time updates.