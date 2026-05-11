import { NextResponse } from "next/server";
import { getNotationTemplate, updateNotationTemplate } from "@/app/api/notationTemplatesApi";

export async function POST(request) {
  try {
    const { templateId, externalLinkId } = await request.json();

    if (!templateId || !externalLinkId) {
      return NextResponse.json(
        { error: "Template ID and External Link ID are required" },
        { status: 400 }
      );
    }

    // Get auth token from the request
    const authHeader = request.headers.get("authorization");
    const tenantIds = request.headers.get("x-tenant-ids");
    
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    const headers = {
      "Authorization": authHeader,
      "X-Tenant-Ids": tenantIds || "",
    };

    // First, get the template to ensure it exists
    const template = await getNotationTemplate(templateId, headers);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Update the template to set it as public submission template
    const updatedTemplate = await updateNotationTemplate(
      templateId,
      {
        ...template,
        isPublicSubmissionTemplate: true,
        isActive: true,
      },
      headers
    );
    
    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: "Template set as public submission template successfully"
    });
  } catch (error) {
    console.error("Error setting public template:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}