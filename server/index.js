const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const Handlebars = require("handlebars");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
connectDB();

const EmailTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  footer: { type: String, required: true },
  imageUrl: String,
  buttonText: String,
  buttonUrl: String,
  fontColor: { type: String, default: "#333333" },
  backgroundColor: { type: String, default: "#ffffff" },
  createdAt: { type: Date, default: Date.now },
});

const EmailTemplate = mongoose.model("EmailTemplate", EmailTemplateSchema);

Handlebars.registerHelper("if", function (conditional, options) {
  if (conditional) {
    return options.fn(this);
  }
  return options.inverse(this);
});

app.get("/api/getEmailLayout", async (req, res) => {
  try {
    const template = await fs.readFile(
      path.join(__dirname, "templates/layout.html"),
      "utf8"
    );
    res.send(template);
  } catch (error) {
    console.error("Error loading template:", error);
    res.status(500).json({ error: "Failed to load template" });
  }
});

app.post("/api/uploadEmailConfig", async (req, res) => {
  try {
    const { title, content, footer, imageUrl, buttonText, buttonUrl } =
      req.body;
    const template = new EmailTemplate({
      title,
      content,
      footer,
      imageUrl,
      buttonText,
      buttonUrl,
    });
    await template.save();
    res.json({ success: true, message: "Template saved successfully" });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({
      error: "Failed to save template",
    });
  }
});

app.post("/api/renderAndDownloadTemplate", async (req, res) => {
  try {
    const { title, content, footer, imageUrl, buttonText, buttonUrl } =
      req.body;

    if (!title || !content || !footer) {
      return res.status(400).json({
        error:
          "Missing required fields: title, content, and footer are required",
      });
    }
    const templateFile = await fs.readFile(
      path.join(__dirname, "templates/layout.html"),
      "utf8"
    );

    Handlebars.registerHelper("if_exists", function (value, options) {
      return value ? options.fn(this) : options.inverse(this);
    });

    const template = Handlebars.compile(templateFile);
    const html = template({
      title,
      content,
      footer,
      imageUrl,
      buttonText,
      buttonUrl,
      imageUrl,
      hasButton: !!buttonText && !!buttonUrl,
    });
    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="email-template.html"'
    );
    res.send(html);
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).json({ error: "Failed to generate template" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
