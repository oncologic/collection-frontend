# Resource Bulk Import Guide

This guide explains how to use the CSV bulk import feature to add multiple resources to your system at once.

## Access

The bulk import feature is available to **admin users only** and can be accessed from the main Resources page via the "Bulk Import" button.

## CSV Format Requirements

### Required Columns

Your CSV file must include these columns (case-sensitive):

- **name** - Resource title/name
- **url** - Primary URL/link to the resource
- **description** - Resource description (can include basic HTML)
- **resourceDate** - Date of the resource (YYYY-MM-DD format)
- **typeId** - Resource type ID (see Resource Types section)

**Note:** If no `tenantId` is specified in the CSV, resources will be automatically assigned to your first available tenant, or to the community tenant if no tenant is available. This ensures all resources have proper tenant assignment for access control.

### Optional Columns

You can include any of these optional columns:

- **organizations** - Organization IDs (comma-separated if multiple). Can be added/modified later through the resource management interface
- **videoUrl** - YouTube or video URL (separate from main URL)
- **resourceUpdatedDate** - When resource was last updated (YYYY-MM-DD format)
- **tenantId** - Tenant ID (if not specified, defaults to your first available tenant or community tenant)
- **sensitivityLevelId** - Sensitivity level ID (see Reference IDs section)
- **expertiseLevelId** - Expertise/experience level ID (see Reference IDs section)
- **timestamps** - Video timestamps in format "0:00 Topic\n2:30 Next Topic"
- **fullText** - Full text content of the resource
- **tags** - Tag IDs (comma-separated)
- **imageKey** - Image/thumbnail key
- **featured** - Boolean (true/false) for featured resources

## Reference IDs

### Resource Types (typeId)

Use these IDs for the `typeId` column:

- **1** - Article
- **2** - Book
- **3** - Research
- **4** - Community
- **5** - Video
- **6** - Website
- **7** - Attachment
- **8** - Download
- **9** - Video

### Organizations

To find organization IDs:

1. Go to your Organizations page
2. View the organization details
3. The ID will be visible in the URL or organization details

### Tenants

**Tenant Assignment Logic:**

- If `tenantId` is specified in CSV and you have access to that tenant, it will be used
- If `tenantId` is empty or not specified, your first available tenant will be used
- If no tenant is available, the community tenant will be used as fallback

To find tenant IDs:

1. Check your available tenants in the system
2. Admin users can see tenant IDs in the tenant selection interface
3. Leave blank to use automatic assignment

### Sensitivity Levels

Common sensitivity levels (exact IDs may vary by system):

- **1** - Public/General
- **2** - Sensitive
- **3** - Restricted

### Expertise Levels

Common expertise levels (exact IDs may vary by system):

- **1** - Beginner
- **2** - Intermediate
- **3** - Advanced

### Tags

To find tag IDs:

1. Go to your Resources page
2. Check existing resources to see available tags
3. Use the tag management interface to view tag IDs

## Sample CSV

Here's a complete example CSV with all columns:

```csv
name,url,description,resourceDate,typeId,organizations,videoUrl,sensitivityLevelId,expertiseLevelId,tags,timestamps,fullText,featured,tenantId
"Mental Health Resources Guide","https://example.com/mental-health-guide","Comprehensive guide covering mental health topics and resources","2024-01-15",1,"","",1,2,"1,3","0:00 Introduction
2:30 Key Points
5:45 Summary","Full article content goes here...",false,
"Trauma-Informed Care Training","https://example.com/trauma-care","Video training on trauma-informed care practices","2024-01-20",5,"1,2","https://youtube.com/watch?v=example",2,1,"2,4","0:00 Welcome
1:15 Definition of Trauma
3:45 Best Practices
10:15 Case Studies","Video transcript content...",true,tenant-123
```

## Usage Instructions

### Step 1: Prepare Your CSV

1. **Download the template** - Use the "Download CSV Template" button in the import interface
2. **Fill in your data** - Add your resources following the column requirements
3. **Validate your data** - Ensure:
   - All required columns are present
   - Dates are in YYYY-MM-DD format
   - URLs are valid
   - IDs reference existing entities in your system
   - No empty required fields

### Step 2: Import Process

1. **Access Import** - Go to Resources page → Click "Bulk Import" button (admin only)
2. **Upload File** - Click "Select File" or drag and drop your CSV
3. **Review Preview** - Check the data preview and fix any validation errors
4. **Import** - Click "Import X Resources" to process the data

### Step 3: Handle Results

- **Success** - Successfully imported resources will appear in your resources list
- **Errors** - Any failed imports will be shown with specific error messages
- **Partial Success** - Some resources may import while others fail

## Validation Rules

The system will validate:

- **Required fields** - All required columns must have values
- **Date format** - Must be YYYY-MM-DD
- **URL format** - Must be valid URLs
- **Reference IDs** - Must exist in your system
- **Data types** - Numbers for IDs, proper formatting for all fields

## Common Issues & Solutions

### Issue: "Invalid typeId"

**Solution:** Use the correct resource type IDs listed above, or check your system's resource types.

### Issue: "Invalid organization ID"

**Solution:** Verify the organization exists and you have the correct ID.

### Issue: "Invalid date format"

**Solution:** Use YYYY-MM-DD format (e.g., 2024-01-15).

### Issue: "Missing required field"

**Solution:** Ensure all required columns have values for every row.

### Issue: "Invalid URL format"

**Solution:** Include http:// or https:// in URLs.

### Issue: "Invalid tenant ID"

**Solution:** Verify you have access to the specified tenant. Leave blank to use automatic tenant assignment.

### Issue: Organization-Tenant Relationships

**Note:** Resources are assigned to both organizations and tenants. You can later modify organization assignments through the resource management interface. The tenant assignment helps determine access permissions and data isolation.

**Organization Management:** Resources can be imported without any organization assignments and tied to organizations later through the resource editing interface. This is useful for bulk imports where organization relationships haven't been determined yet.

## Best Practices

1. **Start Small** - Test with a few resources first
2. **Use Template** - Always start with the downloaded template
3. **Validate Data** - Double-check all IDs and formats before importing
4. **Backup** - Export existing resources before large imports
5. **Incremental Imports** - Import in batches rather than all at once

## Video Timestamps Format

For video resources, use this format for timestamps:

```
0:00 Introduction
2:30 Main Topic
5:45 Conclusion
```

Each timestamp should be on a new line with the format: `MM:SS Topic` or `HH:MM:SS Topic`

## Troubleshooting

If you encounter issues:

1. **Check the validation errors** - The system will show specific issues
2. **Verify your CSV format** - Ensure proper comma separation and quoting
3. **Test with template** - Try importing the sample template first
4. **Contact support** - If issues persist, contact your system administrator

## Limitations

- Maximum file size: Check your system limits
- Admin access required
- Can only import to your accessible organizations
- Cannot modify existing resources (creates new ones only)

---

_This feature helps streamline adding multiple resources to your system. Always verify imported data after completion._
