import { NextResponse } from "next/server";
import { submitPublicNotation } from "@/app/api/publicNotationsApi";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const submissionData = await request.json();

    // Validate required fields based on new structure
    if (!submissionData.notationData?.title || !submissionData.notationData?.notes) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Use the API function to submit to backend
    const result = await submitPublicNotation(id, submissionData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in public notation submission:", error);
    
    // Check if it's a known error from the API
    if (error.message && error.message !== "Failed to submit notation") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}