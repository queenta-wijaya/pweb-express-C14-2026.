import "dotenv/config";
import express from "express";
import prisma from "./config/prisma";
import { errorHandler, notFound } from "./middlewares/error";
import { logger } from "./middlewares/logger";
import router from "./routes";
import { sendSuccess } from "./utils/response";

const app = express();

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
  sendSuccess(res, 200, "Server dan database OK");
});

app.use("/api", router);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, (error?: Error) => {
  if (error) {
    throw error;
  }
  console.log(`Server berjalan di http://localhost:${port}`);
});

const shutdown = async (): Promise<void> => {
  server.close();
  await prisma.$disconnect();
  console.log("Database disconnected");
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
