import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { isLoaded, userId, getToken } = useClerkAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push("/sign-in");
    }
  }, [isLoaded, userId, router]);

  const getAuthHeader = async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return {
    isLoaded,
    userId,
    getAuthHeader,
    isAuthenticated: !!userId,
  };
}
