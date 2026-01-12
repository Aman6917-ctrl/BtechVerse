# TODO: Fix Notes Viewing Issues

## Issues Identified
- Slow PDF loading when viewing notes
- JavaScript errors: hideLoading not defined, 403 Forbidden, SecurityError in cross-origin frame

## Fixes Applied
- [x] Changed PDF viewer from Mozilla PDF.js to direct iframe loading to avoid CORS issues and speed up loading
- [x] Updated preloadPDF function to load signed URL directly

## Remaining Tasks
- [ ] Test the changes to ensure PDFs load faster
- [ ] Verify hideLoading error is resolved
- [ ] Check if 403 errors persist (may require credential update)
- [ ] Add better error handling for failed PDF loads
- [ ] Optimize loading indicator timing
