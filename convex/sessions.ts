import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generatePasscode, generatePlayerId, isValidPasscode } from "./utils";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get all sessions (no auth required for now)
    return await ctx.db
      .query("sessions")
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    // Get all active sessions (multiple sessions can be active now)
    return await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();
  },
});

export const getByPasscode = query({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    if (!isValidPasscode(args.passcode)) {
      return null;
    }
    
    return await ctx.db
      .query("sessions")
      .withIndex("by_passcode", (q) => q.eq("passcode", args.passcode))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    playerNames: v.array(v.string()),
    passcode: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Generate passcode if not provided
    let passcode = "";
    
    if (!args.passcode) {
      // Generate unique passcode - keep trying until we get one that doesn't exist
      let attempts = 0;
      while (attempts < 100) {
        passcode = generatePasscode();
        const existing = await ctx.db
          .query("sessions")
          .withIndex("by_passcode", (q) => q.eq("passcode", passcode))
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();
        if (!existing) break;
        attempts++;
      }
      if (attempts >= 100) {
        throw new Error("Unable to generate unique passcode");
      }
    } else {
      // Validate provided passcode
      if (!isValidPasscode(args.passcode)) {
        throw new Error("Passcode must be exactly 6 digits");
      }
      
      // Check if passcode is already in use by an active session
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_passcode", (q) => q.eq("passcode", args.passcode as string))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      
      if (existing) {
        throw new Error("This passcode is already in use by an active session");
      }
      
      passcode = args.passcode;
    }

    // Create players with unique IDs
    const players = args.playerNames.map(name => ({
      id: generatePlayerId(),
      name: name.trim(),
    }));

    return await ctx.db.insert("sessions", {
      name: args.name.trim(),
      players,
      isActive: true,
      passcode,
      // TODO: Add createdBy when auth is implemented
    });
  },
});

export const addPlayer = mutation({
  args: { 
    sessionId: v.id("sessions"),
    playerName: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const trimmedName = args.playerName.trim();
    if (!trimmedName) {
      throw new Error("Player name cannot be empty");
    }

    // Check if player name already exists
    const existingPlayer = session.players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingPlayer) {
      throw new Error("A player with this name already exists");
    }

    // Create new player with unique ID
    const newPlayer = {
      id: generatePlayerId(),
      name: trimmedName,
    };

    // Add player to session
    await ctx.db.patch(args.sessionId, {
      players: [...session.players, newPlayer],
    });

    return null;
  },
});

export const end = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(args.sessionId, {
      isActive: false,
      endedAt: Date.now(),
    });
  },
});

export const getResults = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Get all games for this session
    const games = await ctx.db
      .query("games")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    // Calculate totals for each player - handle both new and legacy formats
    const totals: Record<string, number> = {};
    let players: Array<{ id: string; name: string; }> = [];

    if (session.players) {
      // New format: session-scoped players
      players = session.players;
      for (const player of session.players) {
        totals[player.id] = 0;
      }
    }

    for (const game of games) {
      for (const [playerId, points] of Object.entries(game.points)) {
        if (totals[playerId] !== undefined) {
          totals[playerId] += points;
        }
      }
    }

    // Create final results sorted by points (lowest first)
    const results = players
      .map((player) => ({
        player,
        total: totals[player.id] || 0,
      }))
      .sort((a, b) => a.total - b.total);

    // Return session with normalized format
    const normalizedSession = {
      ...session,
      players,
    };

    return {
      session: normalizedSession,
      games,
      results,
      totalGames: games.length,
    };
  },
});

export const joinByPasscode = mutation({
  args: { passcode: v.string() },
  handler: async (ctx, args) => {
    if (!isValidPasscode(args.passcode)) {
      throw new Error("Invalid passcode format. Passcode must be 6 digits.");
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_passcode", (q) => q.eq("passcode", args.passcode))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!session) {
      throw new Error("No active session found with this passcode");
    }

    // TODO: Add user to participants when auth is implemented
    return session;
  },
});

export const updatePasscode = mutation({
  args: { 
    sessionId: v.id("sessions"),
    newPasscode: v.string()
  },
  handler: async (ctx, args) => {
    if (!isValidPasscode(args.newPasscode)) {
      throw new Error("Passcode must be exactly 6 digits");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.isActive) {
      throw new Error("Cannot update passcode for inactive session");
    }

    // Check if new passcode is already in use by another active session
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_passcode", (q) => q.eq("passcode", args.newPasscode))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing && existing._id !== args.sessionId) {
      throw new Error("This passcode is already in use by another active session");
    }

    await ctx.db.patch(args.sessionId, {
      passcode: args.newPasscode,
    });

    return { success: true };
  },
});

// Session sharing functionality will be added later when authentication is implemented
