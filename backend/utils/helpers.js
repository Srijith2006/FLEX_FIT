export const calculateTrainerScore = ({ yearsOfExperience = 0, avgRating = 0, totalRatings = 0 }) => {
  const experienceWeight = Math.min(yearsOfExperience, 20) * 0.2;
  const ratingWeight = avgRating * 1.5;
  const trustWeight = Math.min(totalRatings, 100) * 0.02;
  return Number((experienceWeight + ratingWeight + trustWeight).toFixed(2));
};
