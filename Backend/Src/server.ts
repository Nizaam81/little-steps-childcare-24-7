import app from "./app.js";
import DatabaseConnection from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);



const startServer = async (): Promise<void> => {
  await DatabaseConnection.connect();

  app.instance.listen(port, () => {
    console.info(`Server is running on http://localhost:${port}`);
  });
};

startServer().catch((error: unknown) => {
  console.error("Failed to start server", error);
  process.exitCode = 1;
});
