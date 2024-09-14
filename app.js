const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ashraf123@",
  database: "event_management",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Database connected");
});

// Routes

// Home Route
app.get("/", (req, res) => {
  db.query("SELECT * FROM events", (err, results) => {
    if (err) throw err;
    res.render("index", { events: results });
  });
});

// Event Details Route
app.get("/event/:id", (req, res) => {
  const eventId = req.params.id;
  db.query("SELECT * FROM events WHERE id = ?", [eventId], (err, event) => {
    if (err) throw err;
    db.query(
      "SELECT * FROM attendees WHERE event_id = ?",
      [eventId],
      (err, attendees) => {
        if (err) throw err;
        res.render("event", { event: event[0], attendees });
      }
    );
  });
});

// Create Event Route
app.post("/create", (req, res) => {
  const { title, date, description } = req.body;
  db.query(
    "INSERT INTO events (title, date, description) VALUES (?, ?, ?)",
    [title, date, description],
    (err) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
});

// RSVP Route
app.post("/rsvp", (req, res) => {
  const { eventId, userName, userEmail } = req.body;
  db.query(
    "INSERT INTO attendees (event_id, name, email) VALUES (?, ?, ?)",
    [eventId, userName, userEmail],
    (err) => {
      if (err) throw err;
      sendReminder(userEmail, eventId);
      res.redirect(`/event/${eventId}`);
    }
  );
});

// Send Reminder
function sendReminder(email, eventId) {
  db.query("SELECT * FROM events WHERE id = ?", [eventId], (err, event) => {
    if (err) throw err;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "daniyalashraf907@gmail.com",
        pass: "Daniyal123@",
      },
    });
    const mailOptions = {
      from: "daniyalashraf907@gmail.com",
      to: email,
      subject: `Reminder: ${event[0].title}`,
      text: `Reminder for the event: ${event[0].title} on ${event[0].date}`,
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.log(err);
      else console.log("Email sent: " + info.response);
    });
  });
}

app.post("/delete-event", (req, res) => {
  const eventId = req.body.eventId;

  if (!eventId) {
    return res.status(400).send("Event ID is required.");
  }

  const query = "DELETE FROM events WHERE id = ?";
  db.query(query, [eventId], (err, result) => {
    if (err) {
      console.error("Error deleting event:", err);
      return res.status(500).send("Internal Server Error");
    }

    res.redirect("/"); // Redirect to events list or homepage
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
