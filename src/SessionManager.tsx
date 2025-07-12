import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function SessionManager() {
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);

  const players = useQuery(api.players.list) || [];
  const sessions = useQuery(api.sessions.list) || [];
  const activeSession = useQuery(api.sessions.getActive);
  
  const createSession = useMutation(api.sessions.create);
  const endSession = useMutation(api.sessions.end);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    let playerIds = selectedPlayerIds;
    
    // If no players selected, prompt user
    if (playerIds.length === 0) {
      const confirmed = window.confirm(
        "No players selected. Do you want to create a session with all players?"
      );
      if (confirmed) {
        playerIds = players.map(p => p._id);
      } else {
        return;
      }
    }

    if (playerIds.length < 2) {
      toast.error("Please select at least 2 players");
      return;
    }

    try {
      await createSession({
        name: newSessionName.trim(),
        playerIds: playerIds as any,
      });
      setNewSessionName("");
      setSelectedPlayerIds([]);
      setShowNewSession(false);
      toast.success("Session started successfully");
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    
    const confirmed = window.confirm("Are you sure you want to end this session?");
    if (!confirmed) return;

    try {
      await endSession({ sessionId: activeSession._id });
      toast.success("Session ended");
    } catch (error) {
      toast.error("Failed to end session");
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Sessions</h2>
        <p className="text-gray-600">Start new sessions and view session history</p>
      </div>

      {/* Active Session */}
      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Active Session: {activeSession.name}
              </h3>
              <p className="text-green-700">
                Players: {activeSession.players.map(p => p?.name).join(", ")}
              </p>
            </div>
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* New Session */}
      {!activeSession && (
        <div className="space-y-4">
          {!showNewSession ? (
            <button
              onClick={() => setShowNewSession(true)}
              disabled={players.length < 2}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {players.length < 2 ? "Add at least 2 players first" : "Start New Session"}
            </button>
          ) : (
            <form onSubmit={handleCreateSession} className="space-y-4 border border-gray-200 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Enter session name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Players (leave empty to include all)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {players.map((player) => (
                    <label
                      key={player._id}
                      className="flex items-center space-x-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player._id)}
                        onChange={() => togglePlayerSelection(player._id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{player.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium"
                >
                  Start Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSession(false);
                    setNewSessionName("");
                    setSelectedPlayerIds([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Session History */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Session History ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No sessions yet</p>
            <p className="text-sm">Start your first session to begin tracking points</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`p-4 rounded-lg border ${
                  session.isActive
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {session.name}
                      {session.isActive && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Players: {session.players.map(p => p?.name).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(session._creationTime).toLocaleDateString()}
                      {session.endedAt && ` - ${new Date(session.endedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
