/**
 * Test script to preview the enhanced Room Redesigner prompt
 */

// Mock the service to see generated prompts
const buildPrompt = (options) => {
  const { design_style, seasonal_preference, budget_level } = options;

  // SECTION 1: Task Definition
  let prompt = `You are a professional virtual staging AI for real estate photography. `;
  prompt += `Using the provided room photograph, add furniture and decorations in a ${design_style} style.`;

  // SECTION 2: Absolute Preservation Rules (RENFORCÉ v2)
  prompt += `

ABSOLUTE PRESERVATION - NEVER MODIFY THESE ELEMENTS:

GLAZING & OPENINGS (most critical):
- Sliding glass doors / bay windows: preserve EXACT number of panels, frame color, dimensions
- All windows: keep exact position, size, shape, and frame style
- All doors: keep exact position, size, style, and handle placement
- Balcony/terrace access: preserve exact glass panel configuration

SURFACES (do not change material or color):
- Floor: keep the EXACT flooring material (tile, wood, carpet, concrete) and color
- Walls: preserve wall color, texture, and any architectural details
- Ceiling: keep exact ceiling type, height, beams, coffers, or architectural features

FIXED ELEMENTS:
- Built-in lighting: preserve track lights, recessed lights, ceiling fixtures positions
- Electrical: keep outlets, switches, thermostats in exact positions
- HVAC: preserve vents, radiators, air conditioning units
- Built-in furniture: keep any built-in shelves, closets, kitchen cabinets

ARCHITECTURAL FEATURES:
- Columns, beams, arches: preserve all structural elements
- Ceiling details: keep any drops, trays, or architectural ceiling features
- Wall niches, alcoves: preserve all wall configurations`;

  // SECTION 3: Staging scope (RENFORCÉ v2)
  prompt += `

YOUR STAGING TASK - YOU MAY ONLY ADD:
- Freestanding furniture (sofas, chairs, tables, beds - NOT built-in)
- Decorative objects (plants, artwork, vases, books, cushions)
- Rugs and carpets (placed ON existing floor, not replacing it)
- Table lamps and floor lamps (NOT ceiling fixtures)
- Window treatments (curtains/blinds that FRAME windows, never hide them)
- Soft furnishings that match ${design_style} aesthetic

YOU MUST NOT:
- Change any flooring material or color
- Modify ceiling structure or lighting fixtures
- Alter window/door configurations or frame colors
- Add or remove any architectural elements`;

  // SECTION 4: Style-specific guidance
  if (seasonal_preference) {
    prompt += `

Incorporate subtle ${seasonal_preference} seasonal touches in decor colors and accessories.`;
  }

  if (budget_level) {
    const budgetGuidance = {
      low: 'Use accessible, functional furniture with clean lines. IKEA-style practicality.',
      medium: 'Use quality mid-range furniture. West Elm or Crate & Barrel aesthetic.',
      high: 'Use premium designer furniture. Restoration Hardware or Design Within Reach quality.',
      luxury: 'Use high-end bespoke pieces. Custom designer furniture and statement art pieces.',
    };
    prompt += `

Budget aesthetic: ${budgetGuidance[budget_level]}`;
  }

  // SECTION 5: Output requirements
  prompt += `

OUTPUT REQUIREMENTS FOR REAL ESTATE:
- Photorealistic quality suitable for MLS listings
- Furniture must be realistically proportioned (no distorted perspectives)
- Staging must enhance the space without overcrowding
- Maintain professional, neutral appeal for broad buyer attraction
- The result must accurately represent the actual room dimensions and features`;

  return prompt;
};

// Test cases
console.log('🎨 ROOM REDESIGNER - Enhanced Prompt Preview\n');
console.log('='.repeat(80));

// Test 1: Modern style with high budget
console.log('\n📋 TEST 1: Modern + High Budget\n');
console.log(buildPrompt({
  design_style: 'modern',
  budget_level: 'high',
}));

console.log('\n' + '='.repeat(80));

// Test 2: Scandinavian with winter seasonal preference
console.log('\n📋 TEST 2: Scandinavian + Winter + Medium Budget\n');
console.log(buildPrompt({
  design_style: 'scandinavian',
  seasonal_preference: 'winter',
  budget_level: 'medium',
}));

console.log('\n' + '='.repeat(80));

// Test 3: Luxury traditional
console.log('\n📋 TEST 3: Traditional + Luxury Budget\n');
console.log(buildPrompt({
  design_style: 'traditional',
  budget_level: 'luxury',
}));

console.log('\n' + '='.repeat(80));
console.log('\n✅ All test prompts generated successfully!\n');
