# Bulk Notation Import Guide

This guide explains how to bulk import notations/notes into the system using JSON files.

## Overview

The bulk import feature allows you to create multiple notations at once by uploading a JSON file. This is useful for:
- Importing social media post schedules
- Creating multiple notes from external sources
- Batch creating notations from templates

## Quick Start

1. **Download the template** - Click the "Template" button in the Bulk Import section
2. **Fill in your notations** - Use the template as a guide
3. **Upload the file** - Select your JSON file
4. **Review and import** - The system will validate and show a preview
5. **Click Import** - All notations will be created

## JSON File Format

### Schema

```json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Your Import Title",
    "createdBy": "Your Name",
    "createdAt": "2024-11-20T10:00:00Z",
    "description": "Optional description"
  },
  "notations": [
    {
      "title": "Notation Title",
      "content": "Notation content (supports markdown)",
      "date": "2024-11-25",
      "startTime": "10:00",
      "endTime": "11:00",
      "timezone": "America/Chicago",
      "category": "Action",
      "status": "Pending",
      "visibility": "private",
      "highlighted": false,
      "tags": ["tag1", "tag2"],
      "customFields": {
        "platforms": "Facebook, Instagram",
        "assignedTo": "Team Member"
      }
    }
  ]
}
```

### Required Fields

- `version`: Schema version (currently "1.0.0")
- `metadata`: Object with import metadata
- `notations`: Array of notation objects

### Required Notation Fields

- `title`: The notation title (string)
- `content`: The notation content (string, supports markdown)

### Optional Notation Fields

- `date`: Date in YYYY-MM-DD format (e.g., "2024-11-25")
- `startTime`: Start time in HH:MM format (24-hour, e.g., "10:00")
- `endTime`: End time in HH:MM format (24-hour, e.g., "11:00")
- `timezone`: IANA timezone (e.g., "America/Chicago", "America/New_York")
- `category`: One of: "Idea", "Action", "Thought", "Question", "Observation" (default: "Action")
- `status`: One of: "Pending", "In Progress", "Waiting", "Completed", "Cancelled", "Archived" (default: "Pending")
- `visibility`: One of: "private", "unlisted", "public" (default: "private")
- `highlighted`: Boolean (default: false)
- `tags`: Array of tag names as strings (e.g., ["tag1", "tag2"]). Tags will be matched by name to existing tags. Tags that don't exist will be skipped. To use tag IDs instead, provide objects with `{ id: "uuid", name: "tag name" }` format.
- `customFields`: Object with custom field key-value pairs. Examples:
  - **Text fields**: `"platforms": "Facebook, Instagram"`
  - **Date fields**: `"scheduled": "2024-11-25"` (YYYY-MM-DD format)
  - **Yes/No dropdowns**: `"posted": "yes"` or `"posted": "no"` (typically lowercase, but must match dropdown option values exactly)
  - **Other dropdowns**: Use the exact option value (e.g., `"status": "Pending"`)
  
  **Important**: For dropdown fields, you must use the exact option values as defined in your notation template. When creating dropdowns in the UI, option values are auto-generated as lowercase with underscores (e.g., "Yes" becomes "yes", "Final Copy" becomes "final_copy"). However, existing templates may have different values, so always verify by:
  - Creating a test notation with your template and checking the saved values
  - Inspecting an existing notation that uses the template
  - Checking the template definition if accessible

## Converting Markdown to JSON

If you have posts in markdown format, you can use the conversion script:

```bash
node scripts/convert-markdown-to-import.js input.md output.json "Import Title" "Description"
```

### Markdown Format

Your markdown file should follow this format:

```markdown
### Post 1: Title
**Date:** November 25, 2024 (description)
**Time:** 10:00 AM Central
**Platforms:** Facebook, Instagram
**Assigned to:** Team Member

**Content:**
Your post content here with markdown support.

---

### Post 2: Title
**Date:** November 26, 2024
**Time:** 2:00 PM Central
...
```

The script will:
- Parse each post section (starting with `### Post X:`)
- Extract date, time, platforms, and assignments
- Convert times to 24-hour format
- Create a valid JSON import file

## Custom Fields

Custom fields allow you to add structured data to your notations. The values must match the field definitions in your notation template.

### Field Types:

- **Text**: Simple string values
  ```json
  "customFields": {
    "platforms": "Facebook, Instagram"
  }
  ```

- **Date**: Use YYYY-MM-DD format
  ```json
  "customFields": {
    "scheduled": "2024-11-25"
  }
  ```

- **Dropdown/Select**: Use exact option values (case-sensitive, typically lowercase)
  ```json
  "customFields": {
    "posted": "yes",    // or "no" (auto-generated from "Yes"/"No" labels)
    "finalCopy": "no"   // or "yes"
  }
  ```
  
  **Note**: Option values are auto-generated when creating dropdowns in the UI:
  - Label "Yes" → value "yes"
  - Label "No" → value "no"  
  - Label "Final Copy" → value "final_copy"
  
  Always verify the exact values in your template before importing!

- **Boolean/Checkbox**: Use `true` or `false`
  ```json
  "customFields": {
    "approved": true
  }
  ```

**Note**: Dropdown option values are typically lowercase (auto-generated from labels). For example:
- Labels "Yes"/"No" → values "yes"/"no"
- Label "Final Copy" → value "final_copy"

However, existing templates may have different values. To find the exact values:
1. Create a test notation using your template
2. Select the dropdown option you want to use
3. Save and check the `customFields` value in the saved notation
4. Use that exact value in your import JSON

## Examples

See `bulk-notation-import-example.json` for a complete example with multiple notations including custom fields.

## Validation

The system validates your JSON file before import:
- Checks required fields
- Validates date formats (YYYY-MM-DD)
- Validates time formats (HH:MM)
- Ensures all notations have titles and content

Any validation errors will be shown before import.

## Import Process

1. **Select File**: Choose your JSON file
2. **Validation**: System checks the file format
3. **Preview**: See how many notations will be imported
4. **Import**: Click import to create all notations
5. **Progress**: Watch progress bar during import
6. **Results**: See success/failure counts

## Tips

- **Start Small**: Test with 1-2 notations first
- **Use Template**: Download the template to ensure correct format
- **Validate Locally**: Check your JSON with a validator before uploading
- **Custom Fields**: Use customFields for platform-specific data
- **Timezones**: Use IANA timezone names (e.g., "America/Chicago")

## Troubleshooting

**"Invalid JSON"**: Check your JSON syntax with a validator

**"Missing title"**: Ensure all notations have a title field

**"Invalid date format"**: Use YYYY-MM-DD format (e.g., "2024-11-25")

**"Invalid time format"**: Use HH:MM format (e.g., "10:00" or "14:30")

**Import fails**: Check browser console for detailed error messages

## Production Workflow

1. Create markdown file locally with Cursor/AI assistance
2. Convert to JSON using the script: `node scripts/convert-markdown-to-import.js posts.md import.json`
3. Download template if needed: Click "Template" button in UI
4. Upload JSON file in production environment
5. Review and import

