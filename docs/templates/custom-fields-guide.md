# Custom Fields Guide for Bulk Notation Import

This guide explains how to use custom fields in your bulk notation import JSON files.

## Understanding Custom Fields

Custom fields are defined in your notation templates. When importing, you need to provide values that match the field definitions exactly.

## Common Custom Field Types

### 1. Text Fields
Simple text input fields:
```json
"customFields": {
  "platforms": "Facebook, Instagram, Twitter/X",
  "assignedTo": "Team Member Name"
}
```

### 2. Date Fields
Use YYYY-MM-DD format:
```json
"customFields": {
  "scheduled": "2024-11-25"
}
```

### 3. Dropdown/Select Fields (Yes/No)
**Important**: Use the exact option values from your template. When creating dropdowns in the UI, values are auto-generated as lowercase:
```json
"customFields": {
  "posted": "yes",      // Typically "yes" or "no" (lowercase)
  "finalCopy": "no"     // Must match template option.value exactly
}
```

**How option values are generated**:
- When you create a dropdown option with label "Yes", the system auto-generates value "yes" (lowercase)
- When you create a dropdown option with label "No", the system auto-generates value "no" (lowercase)
- Multi-word labels like "Final Copy" become "final_copy" (lowercase with underscores)

**Always verify**: Existing templates may have different values. Check your template or a test notation to confirm.

### 4. Dropdown/Select Fields (Other Options)
Use the exact option value from your template:
```json
"customFields": {
  "priority": "High",   // Must match one of the template options
  "status": "Draft"     // Exact match required
}
```

### 5. Boolean/Checkbox Fields
Use `true` or `false`:
```json
"customFields": {
  "approved": true,
  "featured": false
}
```

## Finding Custom Field Values

To find the exact values your template expects:

1. **Create a test notation** in the UI using your template
2. **Check the dropdown options** - note the exact text used
3. **Check existing notations** - look at their customFields values
4. **Use the template definition** - if you have access to the template JSON

## Example: Social Media Post Template

If your template has these custom fields:
- `scheduled` (date) - Format: YYYY-MM-DD
- `posted` (dropdown: Yes/No) - Values: "Yes" or "No"
- `finalCopy` (dropdown: Yes/No) - Values: "Yes" or "No"

Your import JSON should look like:

```json
{
  "title": "Post 1: Early Awareness",
  "content": "Your post content here...",
  "date": "2024-11-25",
  "customFields": {
    "scheduled": "2024-11-25",
    "posted": "No",
    "finalCopy": "No"
  }
}
```

## Troubleshooting

**Issue**: Custom field value not saving
- **Solution**: Check that the value exactly matches the template option (case-sensitive)

**Issue**: Date field not working
- **Solution**: Ensure date is in YYYY-MM-DD format (e.g., "2024-11-25", not "11/25/2024")

**Issue**: Dropdown showing wrong value
- **Solution**: Verify the value matches exactly (including capitalization and spacing)

## Best Practices

1. **Test with one notation first** before importing many
2. **Use the template download** to see example values
3. **Keep a reference** of your template's custom field definitions
4. **Validate before importing** - check your JSON format

