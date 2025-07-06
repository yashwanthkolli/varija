const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  googleId: String,
  date: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Delete related cart and orders before user is deleted
UserSchema.pre('findOneAndDelete', async function(next) {
  const user = await this.model.findOne(this.getFilter());
  if (user) {
    await Cart.deleteMany({ userId: user._id });
    await Order.deleteMany({ userId: user._id });
  }
  next();
});

module.exports = User = mongoose.model("user", UserSchema);
