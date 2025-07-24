import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
  omit: {
    user: {
      password_hash: true,
    },
  },
}).$extends(withAccelerate());

export default prisma;
