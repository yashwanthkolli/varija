const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  "/",
  [
    check("name", "Name is required")
      .not()
      .isEmpty(),
    check("phone", "Please include a valid phone number").exists(),
    // check(
    //   "password",
    //   "Please enter a password with 6 or more characters"
    // ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors)
      return res.status(400).json({ errors: errors.array() });
    }

    // const { name, phone, password } = req.body;
    const { name, phone } = req.body;

    try {
      let user = await User.findOne({ phone });

      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      user = new User({
        name,
        phone,
        // password
      });

      // const salt = await bcrypt.genSalt(10);

      // user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      res.status(500).send("Server error");
    }
  }
);

// DELETE /api/users/:id
router.post('/delete', async (req, res) => {
  const { phone, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Verify password
    if (!password) return res.status(401).json({ message: 'Enter Password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    // 3. Delete user (triggers cascading deletes)
    await User.findOneAndDelete({ _id: user._id });

    return res.status(200).json({ message: 'User, cart, and orders deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
