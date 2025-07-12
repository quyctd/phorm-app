import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("players")
      .collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("players", {
      name: args.name.trim(),
    });
  },
});

export const remove = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Check if player is part of any sessions
    const sessionsWithPlayer = await ctx.db
      .query("sessions")
      .collect();

    const playerInSessions = sessionsWithPlayer.filter(session =>
      session.playerIds.includes(args.playerId)
    );

    if (playerInSessions.length > 0) {
      const sessionNames = playerInSessions.map(s => s.name).join(", ");
      throw new Error(
        `Cannot delete player "${player.name}" because they are part of the following sessions: ${sessionNames}. Historical game data must be preserved.`
      );
    }

    await ctx.db.delete(args.playerId);
  },
});
