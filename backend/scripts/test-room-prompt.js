/**
 * Test script to preview the enhanced Room Redesigner prompt
 */

// Mock the service to see generated prompts
const buildPrompt = (options) => {
  const { design_style, seasonal_preference, budget_level } = options;

  // SECTION 1: Task Definition
  let prompt = `You are a professional virtual staging AI for real estate photography. `;
  prompt += `Using the provided room photograph, add furniture and decorations in a ${design_style} style.`;

  // SECTION 2: Absolute Preservation Rules
  prompt += `

CRITICAL PRESERVATION RULES - DO NOT MODIFY:
- All windows: keep exact position, size, and shape
- All doors: keep exact position, size, and style
- All architectural features: walls, ceilings, floors, columns, beams, arches
- All fixed installations: electrical outlets, light switches, built-in fixtures, radiators, air vents
- All structural elements: baseboards, crown moldings, door frames, window frames
- Room dimensions and perspective: maintain exact spatial proportions
- Natural lighting: preserve light sources and shadows from windows
- Floor plan layout: do not add or remove any architectural openings`;

  // SECTION 3: Staging scope
  prompt += `

YOUR STAGING TASK - ADD ONLY:
- Furniture appropriate for the room type (sofas, tables, chairs, beds, etc.)
- Decorative items (plants, artwork, rugs, cushions, lamps)
- Window treatments (curtains, blinds) that frame but do not hide windows
- Accessories that enhance the ${design_style} aesthetic`;

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
