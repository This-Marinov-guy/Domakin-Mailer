import express from "express";
import cors from "cors";
import { allowedOrigins } from "./utils/access.js";
import { firewall, rateLimiter } from "./middleware/firewall.js";
import dotenv from "dotenv";
import { subscribedNewsletterClients } from "./utils/database.js";
import { sendMarketingEmail } from "./services/email-transporter.js";
import { DOMAKIN_LIST_ROOM_EN } from "./utils/templates.js";
import { fetchOneProperty } from "./controllers/property-controller.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set

// Firewall
app.set("trust proxy", true);

if (app.get('env') !== 'development') {  
  app.use(rateLimiter);
  app.use(firewall);
} else {
  allowedOrigins.push('http://localhost:3000')
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new HttpError('There was a problem with your request, please try again later!', 403)); 
      }
    },
  })
);

app.use((req, res, next) => {
  if ("OPTIONS" == req.method) {
    return res.sendStatus(200);
  } else {
    next();
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Background Task
async function App() {

}

App();
