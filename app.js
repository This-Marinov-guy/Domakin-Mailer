import express from "express";
import { subscribedNewsletterClients } from "./utils/database.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Background Task
async function App() {
  console.log(await subscribedNewsletterClients());
}

App();
