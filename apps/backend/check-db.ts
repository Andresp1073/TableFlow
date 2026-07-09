import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe("DESCRIBE user_roles");
  console.log(JSON.stringify(r, null, 2));
})();
