export const getErrorMessage = (error) => {
  if (error.message.includes("Email is required")) {
    return "Please provide your email address to access this content.";
  }
  if (error.message.includes("Email access validation failed")) {
    return "Your email is not authorized to access this content.";
  }
  if (error.message.includes("Email not authorized")) {
    return "Your email is not authorized to access this content.";
  }
  if (error.message.includes("Access denied")) {
    return "You do not have permission to view this content.";
  }
  if (error.message.includes("Invalid or expired token")) {
    return "This shared link is invalid or has expired.";
  }
  if (error.message.includes("Backend Auto-Resolution Required")) {
    return error.message; // Return the full detailed message
  }
  if (
    error.message.includes("Shared link not found") ||
    error.message.includes("has expired")
  ) {
    return "This shared link is invalid, expired, or has been revoked.";
  }
  if (error.message.includes("Link not found")) {
    return "The requested content could not be found.";
  }
  if (error.message.includes("backend auto-resolution")) {
    return "Unable to access this external link within the collection. The backend needs to implement auto-resolution for external links.";
  }
  if (error.message.includes("Missing required parameters")) {
    return "Missing required information to access this content.";
  }
  return error.message || "An unexpected error occurred.";
};
