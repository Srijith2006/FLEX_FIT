const StarRating = ({ value = 0 }) => {
  const stars = Array.from({ length: 5 }).map((_, i) => (i + 1 <= Math.round(value) ? "★" : "☆"));
  return <span style={{ color: "#f59e0b" }}>{stars.join(" ")}</span>;
};

export default StarRating;
