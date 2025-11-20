import { QueryCtx, MutationCtx } from "../_generated/server";

export async function getCurrentUserId(
  ctx: QueryCtx | MutationCtx
) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject ?? null;   // chỉ cần string
}
