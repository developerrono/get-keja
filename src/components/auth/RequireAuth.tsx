import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: ("tenant" | "landlord" | "admin" | "verified_landlord")[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const navigate = useNavigate();

  // 1. Grab the user data stored from our XAMPP login endpoint
  const storedUser = localStorage.getItem("keja_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    // 2. If no user session exists locally, redirect to the login screen
    if (!user) {
      navigate({ to: "/auth" }); // or wherever your login route points
      return;
    }

    // 3. If roles are restricted and the user doesn't have permissions, redirect
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate({ to: "/" }); // Send unauthorized users back to the homepage
    }
  }, [user, navigate, allowedRoles]);

  // If everything looks golden, render the protected component (like LandlordSidebar/TenantSidebar)
  return user ? <>{children}</> : null;
}