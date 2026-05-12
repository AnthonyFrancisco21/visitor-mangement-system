import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Using process.env is often safer in Next.js 15+
    url: process.env.DATABASE_URL!,
  },
});
