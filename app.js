const express = require("express");
const path = require("path");
const { connectToDb } = require("./db");
const Birthday = require("./models/Birthday");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const { emailContent } = require("./emailContent");
const logger = require("./logger/logger");

require("dotenv").config();

const PORT = process.env.PORT || 3004;
const app = express();

// Connect to Mongo Database
connectToDb();

// Set templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Set body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  // host: "smtp.gmail.com",
  // port: 587,
  // secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.APP_PASSWORD,
  },
});

// Scheduling job to send birthday emails by 7am
const job = schedule.scheduleJob("0 7 * * *", async () => {
  logger.info("Job is running");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await new Promise((resolve, reject) => {
    // verify connection configuration
    transporter.verify(function (error, success) {
      if (error) {
        logger.error(error);
        reject(error);
      } else {
        logger.info("Server is ready to take our messages");
        resolve(success);
      }
    });
  });

  // Check DB for today's birthdays
  const birthdayToday = await Birthday.find({
    dob: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
  });

  for (const birthday of birthdayToday) {
    const { email, username } = birthday;

    const mailOptions = {
      from: "Celebration Crew <format.demoprop@gmail.com>",
      to: email,
      subject: "Happy Birthday",
      html: emailContent(username),
    };

    await new Promise((resolve, reject) => {
      // send mail
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          logger.error("Error sending email", err);
          reject(err);
        } else {
          logger.info("Birthday email sent", info);
          resolve(info);
        }
      });
    });
  }

});

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/success", (req, res) => {
  res.render("success");
});

app.post("/", async (req, res) => {
  const { username, email, dob } = req.body;
  await Birthday.create({ username, email, dob });

  res.redirect("success");
});

app.get("*", (req, res) => {
  res.send("Page not found");
});

app.use((err, req, res, next) => {
  res.status(500).json({
    data: null,
    error: "Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
