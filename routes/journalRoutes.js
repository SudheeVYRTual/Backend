

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const { Mood, Journal } = require('../models/Journal');

// Routes
router.get("/mood-entries",  async (req, res) => {
  const entries = await Mood.find().sort({ timestamp: -1 });
  res.json(entries);
});

router.post("/mood-entries",  async (req, res) => {
  const newEntry = new Mood(req.body);
  await newEntry.save();
  res.json(newEntry);
});

router.delete("/mood-entries/:id",  async (req, res) => {
  await Mood.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

router.get("/journal-entries",  async (req, res) => {
  const entries = await Journal.find();
  console.log(entries)
  res.json(entries);
});

router.post("/journal-entries",  async (req, res) => {
  const newEntry = new Journal(req.body);
  await newEntry.save();
  res.json(newEntry);
});

router.delete("/journal-entries/:id",  async (req, res) => {
  console.log("i am here")
  await Journal.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
