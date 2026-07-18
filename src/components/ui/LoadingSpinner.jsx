const LoadingSpinner = ({ size = "md" }) => {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClass}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;
