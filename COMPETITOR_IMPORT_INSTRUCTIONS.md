# Competitor Import Instructions

This guide explains how to import competitors from an Excel file into the Time Tracker system.

## Overview

The Excel import feature allows you to bulk import competitors and register them to events. The system will:
- Create new competitors or update existing ones (matched by email)
- Register competitors to the specified event
- Assign categories (by name or ID)
- Assign sequential numbers (or auto-assign if not provided)
- Generate QR codes automatically

## Excel File Format

### Column Structure

Your Excel file must follow this exact column structure:

| Column | Field | Required | Description | Example |
|--------|-------|----------|-------------|---------|
| **A** | First Name | ✅ Required | Competitor's first name | `John` |
| **B** | Last Name | ✅ Required | Competitor's last name | `Doe` |
| **C** | Email | Optional | Valid email address | `john.doe@example.com` |
| **D** | Phone | Optional | Phone number | `+1234567890` |
| **E** | Event ID | Optional* | The ID of the event | `1` |
| **F** | Category Name/ID | Optional | Category name (text) or Category ID (number) | `Men's Elite` or `2` |
| **G** | Sequential Number | Optional | Competitor number to assign | `101` |

\* *Event ID can be provided via the upload interface (current event) or in Column E. If provided in both, Column E takes precedence.*

### Important Notes

1. **Header Row**: The first row is treated as a header and will be skipped. You can include column headers like "First Name", "Last Name", etc., or leave it empty.

2. **Category Column (F)**: 
   - If you provide a **number** (e.g., `2`), it will be treated as a Category ID
   - If you provide **text** (e.g., `Men's Elite`), it will be treated as a Category Name and looked up
   - The category must exist in the target event

3. **Sequential Number (G)**:
   - Must be a positive integer (greater than 0)
   - Must be unique within the event
   - If not provided, a sequential number will be auto-assigned automatically
   - If a duplicate number is found, that row will fail with an error

4. **Email Matching**:
   - If a competitor with the same email already exists, the existing competitor will be updated
   - If no email is provided, a new competitor will always be created
   - Email is used for duplicate detection, so it's recommended to include it

## Example Excel File

Here's an example of a properly formatted Excel file:

```
| First Name | Last Name | Email              | Phone        | Event ID | Category Name/ID | Sequential Number |
|------------|-----------|-------------------|--------------|----------|------------------|-------------------|
| John       | Doe       | john.doe@example.com | +1234567890 | 1        | Men's Elite      | 101               |
| Jane       | Smith     | jane.smith@example.com | +0987654321 | 1        | Women's Elite    | 201               |
| Bob        | Johnson   |                    | +1122334455 | 2        | 3                |                   |
| Alice      | Brown     | alice@example.com | +1122334456 | 1        | Masters          |                   |
| Mike       | Wilson    | mike@example.com   | +5566778899 | 1        |                  | 301               |
```

### Example Breakdown

- **Row 2**: John Doe will be registered to Event 1, assigned to "Men's Elite" category, with sequential number 101
- **Row 3**: Jane Smith will be registered to Event 1, assigned to "Women's Elite" category, with sequential number 201
- **Row 4**: Bob Johnson will be registered to Event 2, assigned to category with ID 3, sequential number auto-assigned
- **Row 5**: Alice Brown will be registered to Event 1, assigned to "Masters" category, sequential number auto-assigned
- **Row 6**: Mike Wilson will be registered to Event 1, no category, with sequential number 301

## File Requirements

- **Format**: `.xlsx` (Excel 2007+) or `.xls` (Excel 97-2003)
- **Maximum Size**: 10MB
- **Encoding**: UTF-8 (for text fields)
- **First Row**: Treated as header and skipped

## How to Upload

### Step 1: Prepare Your Excel File

1. Open Microsoft Excel, Google Sheets, or any spreadsheet application
2. Create a new spreadsheet or open your existing competitor list
3. Ensure your data follows the column structure described above
4. Save the file as `.xlsx` or `.xls` format

### Step 2: Access the Import Feature

1. Navigate to the **Event Detail** page for the event you want to import competitors to
2. Scroll down to the **"Import Competitors from Excel"** section
3. Review the format instructions if needed

### Step 3: Upload the File

1. Click the **"Choose Excel File"** button
2. Select your Excel file from your computer
3. Wait for the upload to complete (you'll see "Uploading..." status)

### Step 4: Review Results

After the upload completes, you'll see:

- **Summary Statistics**:
  - Total: Total number of rows processed
  - Created: Number of new competitors created
  - Updated: Number of existing competitors updated
  - Skipped: Number of rows skipped (e.g., already registered)
  - Failed: Number of rows that failed to import

- **Error Messages** (if any):
  - Detailed error messages for each failed row
  - Common errors include:
    - Missing required fields (First Name, Last Name)
    - Invalid email format
    - Category not found
    - Duplicate sequential number
    - Event not found

## Common Scenarios

### Scenario 1: Import to Current Event Only

If you're importing competitors to the event you're currently viewing:

1. **Option A**: Leave Column E (Event ID) empty - all competitors will be registered to the current event
2. **Option B**: Include the event ID in Column E for clarity

### Scenario 2: Import to Multiple Events

If you want to import competitors to different events in the same file:

1. Include the Event ID in Column E for each row
2. Each row can have a different Event ID
3. Make sure all Event IDs exist in the system

### Scenario 3: Using Category Names

If you prefer to use category names instead of IDs:

1. Enter the exact category name in Column F (case-sensitive)
2. Example: `Men's Elite`, `Women's Elite`, `Masters`, etc.
3. The category must exist in the target event

### Scenario 4: Using Category IDs

If you know the category IDs:

1. Enter the numeric ID in Column F
2. Example: `1`, `2`, `3`, etc.
3. The category ID must exist in the target event

### Scenario 5: Custom Sequential Numbers

If you want to assign specific competitor numbers:

1. Enter the desired number in Column G
2. Numbers must be positive integers (1, 2, 3, ...)
3. Each number must be unique within the event
4. If you leave it empty, numbers will be auto-assigned

### Scenario 6: Auto-Assign Sequential Numbers

If you don't care about specific numbers:

1. Leave Column G empty
2. The system will automatically assign sequential numbers
3. Numbers start from the next available number for that event

## Best Practices

1. **Always Include Email**: Including email addresses helps prevent duplicate competitors and allows the system to update existing records

2. **Verify Category Names**: Before importing, verify that category names match exactly (including capitalization and special characters)

3. **Check Sequential Numbers**: If assigning custom sequential numbers, ensure they're unique and don't conflict with existing assignments

4. **Test with Small File First**: For large imports, test with a small file (5-10 rows) first to verify the format is correct

5. **Keep Backup**: Always keep a backup of your original Excel file before importing

6. **Review Errors**: After import, review any errors and fix them in your Excel file, then re-import only the corrected rows

## Troubleshooting

### Error: "Invalid file format"
- **Solution**: Make sure your file is saved as `.xlsx` or `.xls` format

### Error: "File size exceeds 10MB limit"
- **Solution**: Split your file into smaller files (multiple imports) or remove unnecessary data

### Error: "Category with name 'X' not found"
- **Solution**: Verify the category name exists in the event and matches exactly (case-sensitive)

### Error: "Sequential number X is already assigned"
- **Solution**: Use a different sequential number or leave it empty for auto-assignment

### Error: "Event with ID X not found"
- **Solution**: Verify the Event ID exists in the system

### Error: "First name and last name are required"
- **Solution**: Ensure Columns A and B are not empty for all data rows

### Error: "Invalid email format"
- **Solution**: Check that email addresses follow the format: `user@domain.com`

## Import Results Explained

After importing, you'll see different counts:

- **Created**: New competitors that were created and registered
- **Updated**: Existing competitors (matched by email) that were updated with new information
- **Skipped**: Competitors that were already registered to the event (no duplicate registrations)
- **Failed**: Rows that couldn't be imported due to errors (check error messages for details)
- **Total**: Total number of rows processed (excluding header)

## Tips for Large Imports

1. **Break into Batches**: For very large files (1000+ rows), consider breaking them into smaller batches
2. **Validate Data First**: Use Excel's data validation features to catch errors before importing
3. **Use Templates**: Create a template with the correct column structure and reuse it
4. **Monitor Progress**: Watch the upload progress and results to catch issues early

## Support

If you encounter issues not covered in this guide:

1. Check the error messages in the import results
2. Verify your Excel file matches the format exactly
3. Ensure all referenced events and categories exist in the system
4. Contact your system administrator if problems persist

---

**Last Updated**: December 2024

