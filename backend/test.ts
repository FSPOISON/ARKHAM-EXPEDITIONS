import { prisma } from "./src/prisma";

async function test() {
  try {
    const users = await prisma.tbl_usuarios.findMany();
    console.log("Success:", users);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
