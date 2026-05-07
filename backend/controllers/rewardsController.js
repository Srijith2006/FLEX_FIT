// backend/controllers/rewardsController.js
import { User } from "../models/index.js";
import Coupon from "../models/Coupon.js";

export const getMyPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("flexPoints lifetimePoints name");
    res.json({ flexPoints: user.flexPoints || 0, lifetimePoints: user.lifetimePoints || 0 });
  } catch (error) { next(error); }
};

export const getMyCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (error) { next(error); }
};