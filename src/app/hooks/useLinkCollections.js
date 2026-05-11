import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateLinkCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // TODO: Replace with actual API endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/link-collections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create link collection");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["linkCollections"]);
    },
  });
}
