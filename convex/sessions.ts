import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .order("desc")
      .collect();
    
    return await Promise.all(
      sessions.map(async (session) => {
        const players = await Promise.all(
          session.playerIds.map((id) => ctx.db.get(id))
        );
        return {
          ...session,
          players: players.filter(Boolean),
        };
      })
    );
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    
    if (!session) return null;
    
    const players = await Promise.all(
      session.playerIds.map((id) => ctx.db.get(id))
    );
    
    return {
      ...session,
      players: players.filter(Boolean),
    };
  },
});

export const create = mutation({
  args: { 
    name: v.string(),
    playerIds: v.array(v.id("players"))
  },
  handler: async (ctx, args) => {
    // End any active session first
    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    
    if (activeSession) {
      await ctx.db.patch(activeSession._id, {
        isActive: false,
        endedAt: Date.now(),
      });
    }
    
    return await ctx.db.insert("sessions", {
      name: args.name.trim(),
      playerIds: args.playerIds,
      isActive: true,
    });
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
