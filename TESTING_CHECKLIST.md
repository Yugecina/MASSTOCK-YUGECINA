# Batch Nano Banana - Testing Checklist
**Quick reference for testing all UX improvements**

---

## Pre-Testing Setup

1. [ ] Backend server running on port 3000
2. [ ] Frontend running on port 5173
3. [ ] Browser console open (F12) for logging
4. [ ] Valid Google Gemini API key ready
5. [ ] Test images ready (< 10MB each)

---

## 1. Configuration Phase Tests

### Form Validation
- [ ] **Initial state:** All fields empty, submit button disabled
- [ ] **Prompt counter:** Type prompts, see counter update in real-time
- [ ] **Green checkmark:** Shows when prompts valid (1-100)
- [ ] **Red X:** Shows when > 100 prompts
- [ ] **Cost calculation:** Updates as prompt count changes

### API Key Validation
- [ ] **Empty:** No validation indicator
- [ ] **Invalid format:** Type "abc123" → see red X + error message
- [ ] **Valid format:** Type "AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXX" → see green checkmark
- [ ] **Border color:** Changes red (invalid) → green (valid)
- [ ] **Security info:** Click button → expandable details show
- [ ] **Lock icon:** Visible next to security message

### File Upload
- [ ] **Select 4 files:** See error "Maximum 3 files"
- [ ] **Select 11MB file:** See error "File exceeds 10MB limit"
- [ ] **Select 2 valid files:** See green checkmarks with file names + sizes
- [ ] **File display:** Shows "image1.jpg (2.3MB)" format

### Example Prompts
- [ ] **Click "Load Example":** Modal opens
- [ ] **Modal shows:** 4 example prompts in code block
- [ ] **Click "Load Examples":** Prompts populate in textarea, modal closes
- [ ] **Click outside modal:** Modal closes
- [ ] **Click X button:** Modal closes

### Format Helper
- [ ] **Helper box visible:** Shows "Format: Separate each prompt..."
- [ ] **Placeholder text:** Shows actual line breaks (not &#10;)

### Submit Button
- [ ] **Disabled when invalid:** Can't click, shows reason below
- [ ] **Reason messages:** "Add at least one prompt", "Invalid API key format", etc.
- [ ] **Enabled when valid:** All validations pass, button clickable
- [ ] **Button text:** "Generate X Images" (matches count)

---

## 2. Confirmation Modal Tests

### Modal Appearance
- [ ] **Click submit:** Confirmation modal opens
- [ ] **Warning banner:** Yellow background with warning icon
- [ ] **Summary grid:** 4 boxes showing Total Prompts, Cost, Ref Images, API Key
- [ ] **Masked API key:** Shows ••••••••XXXX (last 4 chars)
- [ ] **Pricing info:** Blue box explaining cost

### Modal Interactions
- [ ] **Click "Cancel":** Modal closes, stays on configuration
- [ ] **Click outside:** Modal closes
- [ ] **Click X:** Modal closes
- [ ] **Click "Confirm & Generate":** Modal closes, processing starts

### Data Accuracy
- [ ] **Prompt count:** Matches actual number entered
- [ ] **Cost:** $0.039 per prompt (e.g., 10 prompts = $0.39)
- [ ] **Ref images:** Shows 0, 1, 2, or 3
- [ ] **API key:** Last 4 characters match entered key

---

## 3. Processing Phase Tests

### Step Indicator
- [ ] **Step 2 highlighted:** Blue bar, "Processing" label active
- [ ] **Step 1 complete:** Shows checkmark "✓ Configure"
- [ ] **Step 3 pending:** Gray, inactive
- [ ] **Step counter:** Shows "Step 2 of 3"
- [ ] **Descriptions:** "Generating images" visible

### Progress Stats (Nano Banana only)
- [ ] **Live stats:** "Processing prompt X of Y (Z succeeded, W failed)"
- [ ] **Updates in real-time:** Changes as images process
- [ ] **Status message:** "Generating image X..." or "Finalizing results..."
- [ ] **Counts accurate:** Succeeded + failed = current

### Time Tracking
- [ ] **Elapsed time:** Shows MM:SS format, updates every second
- [ ] **Starts from 0:00:** Begins when processing starts
- [ ] **Est. remaining:** Shows after first prompt completes
- [ ] **Time formats correctly:** e.g., "2:05" not "2:5"

### Progress Bar
- [ ] **Bar visible:** Below time stats
- [ ] **Percentage shown:** Matches progress bar width
- [ ] **Animates smoothly:** Blue bar fills left to right
- [ ] **Updates regularly:** Changes as work completes

### Cancel Functionality
- [ ] **Cancel button visible:** Below progress bar
- [ ] **Click "Cancel Batch":** Confirmation modal opens
- [ ] **Warning message:** Explains data loss
- [ ] **Click "Continue Processing":** Modal closes, continues
- [ ] **Click "Cancel Batch":** Returns to step 1, shows cancelled error

---

## 4. Results Phase Tests

### Step Indicator
- [ ] **Step 3 highlighted:** Blue bar, "Results" label active
- [ ] **Steps 1-2 complete:** Both show checkmark
- [ ] **Success banner:** Green box "Workflow completed successfully!"
- [ ] **Step counter:** Shows "Step 3 of 3"

### Stats Grid (Desktop)
- [ ] **4 columns:** Total, Successful, Failed, Cost
- [ ] **Correct counts:** Match actual results
- [ ] **Color coding:** Success (green), Failed (red), Cost (blue)
- [ ] **Bold numbers:** Large, readable

### Stats Grid (Mobile)
- [ ] **Resize to < 768px:** Grid becomes 2 columns
- [ ] **Layout doesn't break:** All cards visible and readable
- [ ] **Touch friendly:** Easy to tap on mobile

### Filter Buttons
- [ ] **"All" active by default:** Blue background, white text
- [ ] **Shows counts:** e.g., "All (10)", "Success (9)", "Failed (1)"
- [ ] **Click "Success":** Only successful results show, button turns green
- [ ] **Click "Failed":** Only failed results show, button turns red
- [ ] **Click "All":** All results show again
- [ ] **Results count updates:** "Showing X of Y results"

### Sort Dropdown
- [ ] **Default:** "Sort by Index"
- [ ] **Select "By Time":** Results reorder by processing time
- [ ] **Select "By Status":** Results group by status
- [ ] **Dropdown styled:** Matches design system

### Action Buttons
- [ ] **"Download All" enabled:** When success count > 0
- [ ] **"Download All" disabled:** When no successful images (grayed out)
- [ ] **"Regenerate Failures":** Only shows when failed count > 0
- [ ] **Buttons responsive:** Stack on mobile, inline on desktop

### Download All
- [ ] **Click "Download All":** Downloads start
- [ ] **Staggered downloads:** 500ms between each (prevents blocking)
- [ ] **All successful images:** Only downloads completed ones
- [ ] **File naming:** image_1.png, image_2.png, etc.
- [ ] **Console logs:** Shows download progress

### Regenerate Failures
- [ ] **Click button:** Shows "coming soon" alert
- [ ] **Console log:** Logs regenerate request

---

## 5. Individual Result Card Tests

### Successful Result Card
- [ ] **Image displays:** Shows generated image
- [ ] **Correct dimensions:** 48px height (192px in original design)
- [ ] **Batch index:** Shows "#X" in corner
- [ ] **Status badge:** Green "completed"
- [ ] **Prompt text:** Shows first 2 lines (truncated)
- [ ] **Processing time:** Shows "X.XXs"
- [ ] **Hover effect:** Card shadow increases

### Copy URL Button
- [ ] **Hover over image:** Copy button visible in top-right
- [ ] **Click copy:** URL copied to clipboard
- [ ] **Visual feedback:** Icon changes to checkmark for 2s
- [ ] **Checkmark color:** Green
- [ ] **Console log:** "URL copied to clipboard"

### Action Buttons
- [ ] **"View Full Size":** Opens image in new tab
- [ ] **Download button (⬇):** Downloads image immediately
- [ ] **Button styling:** Primary (blue) and secondary (white/bordered)
- [ ] **Touch targets:** Large enough for mobile (44x44px min)

### Failed Result Card
- [ ] **No image:** Shows error icon instead
- [ ] **Error icon:** Red X with "Failed" text
- [ ] **Status badge:** Red "failed"
- [ ] **Error message:** Shows in red box below prompt
- [ ] **Actionable error:** e.g., "Invalid API key. Get new key from..."
- [ ] **Processing time:** Shows if available
- [ ] **No action buttons:** Download/View buttons hidden

### Processing Result Card (if batch still running)
- [ ] **Loading state:** Spinner animation
- [ ] **Status badge:** Yellow "processing"
- [ ] **Text:** "Processing..." below spinner

---

## 6. Error Message Tests

### API Key Errors
- [ ] **Trigger:** Use invalid API key "test123"
- [ ] **Message:** "Invalid API key. Get a new key from Google AI Studio →"
- [ ] **Link included:** Shows URL to get new key
- [ ] **Actionable:** User knows exactly what to do

### Rate Limit Errors
- [ ] **Trigger:** (Requires hitting actual rate limit)
- [ ] **Message:** "Rate limit exceeded. Try again in 5 minutes."
- [ ] **Console log:** Full error details logged

### Network Errors
- [ ] **Trigger:** Disconnect internet during execution
- [ ] **Message:** "Network timeout. Check connection and retry in 30s."
- [ ] **Specific guidance:** Tells user to check connection

### File Size Errors
- [ ] **Trigger:** Upload 11MB file
- [ ] **Message:** "Files exceed 10MB limit: [filename]"
- [ ] **Shows filename:** Lists which files are too large
- [ ] **Inline error:** Appears below file input

---

## 7. Mobile Responsiveness Tests

### Resize Browser (simulate mobile)
- [ ] **< 768px:** Stats become 2 columns
- [ ] **Filters wrap:** Stack vertically if needed
- [ ] **Action buttons wrap:** Stack on small screens
- [ ] **Results grid:** Single column on mobile
- [ ] **Modals fit screen:** No horizontal scroll
- [ ] **Touch targets:** Large enough (44x44px)

### Modal on Mobile
- [ ] **Confirmation modal:** Fits within viewport
- [ ] **Scrollable content:** Can scroll modal body
- [ ] **Buttons accessible:** Easy to tap
- [ ] **Close button:** Large enough touch target

---

## 8. Console Logging Tests

### Check Console Output
- [ ] **Every action logged:** Each interaction produces log
- [ ] **Emoji indicators:** 🔍 ✅ ❌ 📦 etc. show correctly
- [ ] **Component names:** Clear which component logged
- [ ] **Data structures:** Objects logged with keys/values
- [ ] **Error details:** Full error objects on failures
- [ ] **No errors:** No unexpected console errors

### Example Good Logs
```javascript
✅ NanoBananaForm: API key format valid
📝 NanoBananaForm: Example prompts loaded
🚀 NanoBananaForm: Form submitted
📊 WorkflowExecute: Progress stats: {current: 5, total: 10}
✅ BatchResultsView: URL copied to clipboard
```

---

## 9. Edge Cases Tests

### Empty States
- [ ] **0 prompts:** Submit disabled, shows "Add at least one prompt"
- [ ] **101 prompts:** Submit disabled, shows "Maximum 100 prompts"
- [ ] **No results:** Shows empty state with helpful message
- [ ] **Filter with no matches:** Shows "no results match filter"

### Boundary Conditions
- [ ] **1 prompt:** Everything works, singular "prompt" label
- [ ] **100 prompts:** Works, exactly at limit
- [ ] **Exactly 10MB file:** Should work (just under limit)
- [ ] **10.1MB file:** Should fail with error

### Cancel/Interrupt
- [ ] **Cancel during processing:** Returns to config, no errors
- [ ] **Close browser during processing:** (Job continues on server)
- [ ] **Navigate away:** Confirm leaving page (future)

### Multiple Executions
- [ ] **Run Again:** Resets form, clears state
- [ ] **Run different workflow:** No state pollution
- [ ] **Back to workflows:** Navigation works

---

## 10. Accessibility Tests

### Keyboard Navigation
- [ ] **Tab through form:** All inputs reachable
- [ ] **Tab in modal:** Focus trapped in modal
- [ ] **Enter to submit:** Submits form when valid
- [ ] **Escape to close:** (Future - not yet implemented)

### Focus Indicators
- [ ] **Visible focus:** Blue outline on focused element
- [ ] **Logical order:** Tab order makes sense
- [ ] **No focus traps:** Can escape from all areas

### Screen Reader
- [ ] **Labels present:** All inputs have labels
- [ ] **Error announcements:** Errors associated with fields
- [ ] **Button descriptions:** Clear button text/aria-labels

---

## 11. Performance Tests

### Loading
- [ ] **Initial load:** < 2 seconds
- [ ] **Modal open:** Instant, no lag
- [ ] **Filter change:** Instant update
- [ ] **Sort change:** Instant reorder

### Large Batches
- [ ] **100 prompts:** Form handles smoothly
- [ ] **100 results:** Grid renders without lag
- [ ] **Download all 100:** Staggered, doesn't crash

### Memory
- [ ] **No memory leaks:** Check dev tools memory tab
- [ ] **Intervals cleared:** Cancel properly clears polling

---

## 12. Browser Compatibility

### Test in Each Browser
- [ ] **Chrome:** All features work
- [ ] **Firefox:** All features work
- [ ] **Safari:** All features work
- [ ] **Edge:** All features work
- [ ] **Mobile Safari:** Touch works correctly
- [ ] **Mobile Chrome:** Touch works correctly

---

## Pass/Fail Criteria

**PASS Requirements:**
- All critical features work (confirmation, validation, progress, filters)
- No console errors (warnings OK)
- Mobile responsive works
- Downloads work
- Console logging provides good debugging info

**FAIL Indicators:**
- Cannot submit valid form
- Modal doesn't appear
- Progress stats don't update
- Downloads fail
- Layout breaks on mobile
- Console errors present

---

## Bug Reporting Template

If you find issues, report with:

```
**Issue Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Go to workflow execute page
2. Enter 5 prompts
3. Click submit
4. [Expected behavior vs Actual behavior]

**Console Output:**
[Paste relevant console logs with emojis]

**Browser:** Chrome 120 / Firefox 121 / Safari 17 / etc.

**Screenshots:** [If applicable]

**Expected:** [What should happen]

**Actual:** [What happened]
```

---

## Testing Notes

- Test on clean browser state (clear cache, cookies)
- Test with browser console open at all times
- Test each flow end-to-end, not just individual features
- Test both happy path and error cases
- Test on real devices when possible, not just browser resize

---

**Total Tests:** 150+ individual checks
**Estimated Testing Time:** 45-60 minutes for complete pass
**Recommended:** Test in 2-3 sessions to avoid fatigue

---

Good luck with testing! Report any issues you find with full console logs.
