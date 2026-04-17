export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-t-2 border-primary-500 border-r-2 border-transparent ${sizes[size]}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
