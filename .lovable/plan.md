

## Plan: Add Occupancy Status Dropdown to Canvassing Location Screen

### What
Add an "Occupancy Status" dropdown on the canvassing business view screen (the screen showing business details with Correct/Incorrect buttons). The dropdown will appear between the business info cards and the action buttons.

### Options
- Vacant Lot
- Building Under Construction
- Occupied
- Temporarily closed
- Under Construction
- Vacant
- Not sure

### Changes to `src/pages/Canvassing.tsx`

1. **Add state** for `occupancyStatus` (string, default empty or "Not sure")

2. **Add an occupancy status constant array** at the top of the file:
```ts
const OCCUPANCY_STATUSES = [
  "Vacant Lot", "Building Under Construction", "Occupied",
  "Temporarily closed", "Under Construction", "Vacant", "Not sure"
];
```

3. **Insert a dropdown** in the canvassing view (between the business info cards ~line 912 and the Correct/Incorrect buttons ~line 915). It will be a styled `<select>` matching the existing form style.

4. **Reset occupancy status** when moving to the next business (in `moveToNextBusiness`).

5. **Include occupancy status** in the correction data when submitting — append it to the `correctedNotes` field (since there's no dedicated DB column), or pass it through the existing correction flow so it's captured.

6. **Include in confirmed business flow** — when clicking "Correct", pass the occupancy status into the `confirmedBusinessData` so it's available in the intermediate dialog and included in the correction/confirmation record via notes.

This is a single-file change to `src/pages/Canvassing.tsx`.

