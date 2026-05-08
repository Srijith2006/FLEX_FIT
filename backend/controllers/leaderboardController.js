import { User, WorkoutCompletion, Client } from "../models/index.js";

// Award points helper — called from other controllers
export const awardPoints = async (userId, points, reason = "") => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { flexPoints: points, lifetimePoints: points },
    });
  } catch (err) {
    console.error("awardPoints error:", err.message);
  }
};

// GET /api/users/leaderboard
export const getLeaderboard = async (req, res, next) => {
  try {
    // Top 10 — lean query, only safe fields returned
    const top10 = await User.find({ lifetimePoints: { $gt: 0 } })
      .select("name lifetimePoints flexPoints avatar role")
      .sort({ lifetimePoints: -1 })
      .limit(10)
      .lean();

    // Find current user's rank (even if not in top 10)
    const totalAbove = await User.countDocuments({
      lifetimePoints: { $gt: req.user.lifetimePoints || 0 },
    });
    const currentUserRank = totalAbove + 1;

    // Check if current user is already in top 10
    const currentInTop10 = top10.some(u => String(u._id) === String(req.user._id));

    // Attach rank to each entry
    const ranked = top10.map((u, i) => ({
      rank:          i + 1,
      name:          u.name,
      role:          u.role,
      avatar:        u.avatar || u.name?.charAt(0)?.toUpperCase() || "?",
      lifetimePoints: u.lifetimePoints,
      flexPoints:    u.flexPoints,
      isCurrentUser: String(u._id) === String(req.user._id),
    }));

    // Current user's stats
    const currentUser = {
      rank:           currentUserRank,
      name:           req.user.name,
      role:           req.user.role,
      avatar:         req.user.avatar || req.user.name?.charAt(0)?.toUpperCase() || "?",
      lifetimePoints: req.user.lifetimePoints || 0,
      flexPoints:     req.user.flexPoints || 0,
      isCurrentUser:  true,
      inTop10:        currentInTop10,
    };

    res.json({ leaderboard: ranked, currentUser, total: await User.countDocuments() });
  } catch (error) { next(error); }
};

// GET /api/users/my-points — detailed points breakdown for the dashboard
export const getMyPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("flexPoints lifetimePoints name");

    // Count completed workouts as a proxy for activity
    let completedWorkouts = 0;
    if (req.user.role === "client") {
      const client = await Client.findOne({ user: req.user._id });
      if (client) {
        completedWorkouts = await WorkoutCompletion.countDocuments({ client: client._id });
      }
    }

    res.json({
      flexPoints:       user.flexPoints || 0,
      lifetimePoints:   user.lifetimePoints || 0,
      completedWorkouts,
    });
  } catch (error) { next(error); }
};
