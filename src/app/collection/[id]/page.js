"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const CollectionRedirect = ({ params }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all search parameters and preserve them
    const queryParams = new URLSearchParams(searchParams.toString());
    const queryString = queryParams.toString();

    // Redirect to /collections/[id] with all preserved parameters
    const redirectUrl = queryString
      ? `/collections/${params.id}?${queryString}`
      : `/collections/${params.id}`;
    router.replace(redirectUrl);
  }, [router, searchParams, params.id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to collection...</p>
      </div>
    </div>
  );
};

export default CollectionRedirect;
