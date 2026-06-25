import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const accountRouter = createTRPCRouter({
  /** Cambia la contraseña del usuario logueado (pide la actual). */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });

      const ok = await bcrypt.compare(input.currentPassword, user.password);
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "La contraseña actual es incorrecta." });

      if (await bcrypt.compare(input.newPassword, user.password)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La nueva contraseña no puede ser igual a la actual." });
      }

      const hashed = await bcrypt.hash(input.newPassword, 12);
      await ctx.db.user.update({ where: { id: user.id }, data: { password: hashed } });
      return { ok: true };
    }),
});
