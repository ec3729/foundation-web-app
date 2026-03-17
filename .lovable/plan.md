

## Plan: Add Field Mapping UI for Airtable Import

After fetching records from Airtable (the preview step), show a mapping UI where users can assign each Airtable column to a database column before confirming import.

### Changes to `src/pages/Data.tsx`

**New state:**
- `fieldMapping: Record<string, string>` — maps Airtable field names → database column names
- Derive `airtableFields` from preview data keys (excluding `airtableId`)
- Hardcode `dbColumns` per table based on the schema (or derive dynamically)

**Database columns per table** (hardcoded constant):
```ts
const TABLE_COLUMNS: Record<TableName, string[]> = {
  zones: ["id", "name", "description", "estimated_time"],
  storefronts: ["id", "storefront_id", "address", "zip_code", "zone_id", "business_ids"],
  businesses: ["id", "business_id", "business_name", "type", "public_business", "storefront_id", "initial_encounter_made", "notes"],
  // ... etc for all 7 tables
};
```

**Mapping UI** (shown after Airtable fetch, before confirm):
- For each Airtable field, render a row with the field name and a `<select>` dropdown of target DB columns plus a "Skip" option
- Auto-match fields with identical names as defaults
- Replace the current raw preview table with a mapped preview

**Updated `confirmAirtableImport`:**
- Instead of passing through keys directly, remap each record using the `fieldMapping` — for each Airtable field mapped to a DB column, copy the value; skip unmapped fields.

This is a single-file change to `src/pages/Data.tsx`.

