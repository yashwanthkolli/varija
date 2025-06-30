const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("config");

const Admin = require('../../models/Admin');

router.post('/create', async(req, res) => {
  const { email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({ email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully", adminId: newAdmin._id });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin", error });
  }
})

router.post('/login', async(req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ adminId: admin._id }, config.get("jwtSecret"), {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error" });
  }
})

module.exports = router;