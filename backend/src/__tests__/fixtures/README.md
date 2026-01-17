# Test Fixtures

This directory contains test images and data files for E2E workflow tests.

## Required Images

For E2E tests to run successfully, place the following images in this directory:

### 1. `empty-room.jpg`
- **Purpose**: Room Redesigner workflow test (empty room scenario)
- **Requirements**:
  - JPEG format
  - Resolution: 1024x768 or higher
  - Clear photo of an empty room (no furniture)
  - Good lighting
  - Size: < 10MB

**Where to get:**
- Take a photo of an empty room
- Download from stock photo sites (Unsplash, Pexels)
- Use sample from real estate listings

### 2. `furnished-room.jpg`
- **Purpose**: Room Redesigner workflow test (furnished room scenario)
- **Requirements**:
  - JPEG format
  - Resolution: 1024x768 or higher
  - Clear photo of a furnished room
  - Visible furniture and decor
  - Size: < 10MB

**Where to get:**
- Take a photo of a furnished room
- Download from interior design websites
- Use sample from home staging portfolios

### 3. `test-image.jpg`
- **Purpose**: Smart Resizer workflow test (general image resizing)
- **Requirements**:
  - JPEG format
  - Resolution: 1920x1080 or higher
  - Marketing/advertising style image
  - Contains text elements (for OCR testing)
  - Size: < 10MB

**Where to get:**
- Use any marketing banner or ad creative
- Create a simple graphic with text in Canva/Figma
- Download from advertising portfolios

## Image Specifications

### General Requirements
- **Format**: JPEG (.jpg)
- **Color space**: RGB
- **Max file size**: 10MB
- **Min resolution**: 1024x768

### Quality Guidelines
- Clear, well-lit images
- Minimal compression artifacts
- Realistic content (not AI-generated test patterns)
- Representative of real user inputs

## Sample Images

If you need sample images quickly, use these commands:

### Download Sample Empty Room
```bash
curl -o empty-room.jpg "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
```

### Download Sample Furnished Room
```bash
curl -o furnished-room.jpg "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200"
```

### Download Sample Marketing Image
```bash
curl -o test-image.jpg "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920"
```

## Gitignore

This directory is included in `.gitignore` to avoid committing large image files to the repository.

Contents:
```
backend/src/__tests__/fixtures/*.jpg
backend/src/__tests__/fixtures/*.png
backend/src/__tests__/fixtures/*.jpeg
```

## Adding Custom Fixtures

To add your own test images:

1. Place JPEG images in this directory
2. Name them according to the requirements above
3. Update test files to reference new fixtures
4. Document any special requirements in this README

## Testing Without Images

If test images are not available, E2E tests will:
1. Detect missing fixtures
2. Log warning: `⚠️ Test image not found, skipping test`
3. Skip the test (not fail)

This allows CI/CD to pass without test images while still running other tests.

---

**Last Updated**: 2026-01-10
**Maintainer**: MasStock Dev Team
