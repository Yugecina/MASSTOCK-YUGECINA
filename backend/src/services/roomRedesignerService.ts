/**
 * Room Redesigner Service
 *
 * Integrates with Nano Banana Pro API to redesign room photographs
 * with AI-powered interior design transformations.
 */

import axios, { AxiosError } from 'axios';
import { logger } from '../config/logger';

// Design styles supported (synchronized with validation schema)
export type DesignStyle =
  | 'modern'
  | 'minimalist'
  | 'industrial'
  | 'scandinavian'
  | 'contemporary'
  | 'coastal'
  | 'farmhouse'
  | 'midcentury'
  | 'traditional';

export type BudgetLevel = 'low' | 'medium' | 'high' | 'luxury';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter' | 'noel';

export interface RoomRedesignerInput {
  image_base64: string;
  image_mime: string;
  design_style: DesignStyle;
  season?: SeasonType;
  budget_level?: BudgetLevel;
  api_key: string;
}

export interface RoomRedesignerResult {
  success: boolean;
  image_base64?: string;
  processing_time?: number;
  prompt_used?: string;
  error?: string;
}

interface PromptOptions {
  design_style: DesignStyle;
  season?: SeasonType;
  budget_level?: BudgetLevel;
}

class RoomRedesignerService {
  private apiUrl: string;
  private model: string;

  constructor() {
    // Nano Banana Pro = Gemini 3 Pro Image Preview (advanced AI image generation)
    this.apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview'; // Nano Banana Pro
  }

  /**
   * Build a detailed prompt for room redesign based on user preferences
   * Optimized for real estate virtual staging with strict architectural preservation
   * v4: Enhanced to handle FURNISHED rooms - restyle with flexible layout while preserving architecture
   */
  buildPrompt(options: PromptOptions): string {
    const { design_style, season, budget_level } = options;

    // SECTION 1: Role and Task Definition
    let prompt = `You are a professional virtual staging AI for real estate photography.
Your task: RESTYLE this room photograph using a ${design_style.toUpperCase()} interior design style.

=== MISSION CRITIQUE ===
- If the room is EMPTY: Stage it with ${design_style} furniture
- If the room is ALREADY FURNISHED: Replace ALL existing furniture with ${design_style} style furniture
- You may reorganize furniture layout to best fit the ${design_style} style
- ABSOLUTE RULE: The ARCHITECTURE must remain IDENTICAL (walls, windows, floor, ceiling, fixed lighting)
- The output must be THE SAME ROOM with DIFFERENT furniture - NOT a reimagined room

=== RÈGLES DE PRÉSERVATION ABSOLUE (CRITICAL) ===

ANALYSE PRÉALABLE : Avant TOUTE modification, identifiez et verrouillez ces éléments :

VITRAGES & OUVERTURES (PRIORITÉ MAXIMALE):
- Comptez le nombre EXACT de panneaux de fenêtres, baies vitrées
- Notez la couleur EXACTE des cadres (blanc, noir, bois, alu)
- Préservez TOUTES les positions, tailles et styles des fenêtres/portes
- Portes balcon/terrasse : maintenez la configuration EXACTE des panneaux
- NE PAS ajouter, supprimer ou modifier les vitrages

SURFACES (AUCUNE MODIFICATION):
- Sol : GARDER le matériau EXACT (carrelage, parquet, moquette) et sa couleur
- Murs : PRÉSERVER couleur, texture, moulures et détails architecturaux
- Plafond : MAINTENIR type, hauteur et éléments (poutres, caissons)

INSTALLATIONS FIXES (VERROUILLÉES):
- Éclairage encastré, spots, plafonniers : NE PAS DÉPLACER NI AJOUTER
- Lustres : PRÉSERVER position et style EXACTS
- HVAC : ventilations, radiateurs - GARDER en position exacte
- Meubles encastrés : placards, cuisine équipée - AUCUNE MODIFICATION
- Électrique : prises, interrupteurs - PRÉSERVER les positions

ÉLÉMENTS ARCHITECTURAUX (INTOUCHABLES):
- Colonnes, poutres, arches - AUCUN CHANGEMENT
- Détails architecturaux du plafond - PRÉSERVER exactement
- Niches murales, alcôves - MAINTENIR la configuration

=== INSTRUCTIONS PIÈCE VIDE ===

Si cette pièce apparaît VIDE ou peu meublée :
- La pièce EXISTE DÉJÀ - ne la recréez pas
- PRÉSERVEZ les dimensions et proportions exactes
- MAINTENEZ tous les angles et positions des murs
- GARDEZ le matériau, motif et couleur du sol INCHANGÉS
- Fenêtres et portes doivent rester IDENTIQUES à la photo
- UNIQUEMENT AJOUTER meubles autonomes et décorations
- NE PAS altérer la structure de la pièce

=== INSTRUCTIONS PIÈCE MEUBLÉE (SI MEUBLES EXISTANTS) ===

Si cette pièce contient DÉJÀ des meubles ou décorations :
- REMPLACEZ TOUS les meubles existants par des meubles style ${design_style}
- Vous POUVEZ réorganiser le layout des meubles pour mieux correspondre au style
- Mais l'ARCHITECTURE reste INTOUCHABLE (murs, fenêtres, sol, plafond)
- Le résultat doit être LA MÊME PIÈCE avec un NOUVEAU STYLE DE DÉCORATION
- PAS une pièce complètement réimaginée ou recréée de zéro
- L'angle de vue et la perspective : IDENTIQUES à l'original
- Les proportions de la pièce : EXACTEMENT comme l'original

=== PORTÉE DU STAGING - CE QUE VOUS POUVEZ AJOUTER ===

MEUBLES AUTONOMES (style ${design_style}):
- Canapés, fauteuils, chaises d'appoint
- Tables basses, consoles, tables d'appoint
- Lits, tables de nuit, commodes
- Tables et chaises de salle à manger
- Bibliothèques (non encastrées), vitrines

ÉLÉMENTS DÉCORATIFS:
- Plantes d'intérieur et cache-pots
- Œuvres d'art (cadres muraux)
- Vases, sculptures, objets décoratifs
- Livres, magazines, plateaux décoratifs
- Coussins, plaids, couvertures

REVÊTEMENTS DE SOL:
- Tapis (posés SUR le sol existant, jamais en remplacement)

ÉCLAIRAGE (AUTONOME UNIQUEMENT):
- Lampadaires
- Lampes de table
- NE PAS ajouter de plafonniers

HABILLAGE FENÊTRES (ENCADREMENT UNIQUEMENT):
- Rideaux qui ENCADRENT les fenêtres (ne les cachent jamais)
- Voilages laissant passer la lumière
- Stores montrés OUVERTS`;

    // SECTION 2: Style-Specific Guidance
    const styleGuides: Record<DesignStyle, string> = {
      modern: 'Meubles aux lignes géométriques épurées, couleurs neutres (blanc, gris, noir), accents chrome/acier, ornementation minimale.',
      minimalist: 'Uniquement pièces essentielles, maximum d\'espace négatif, palette monochrome, zéro encombrement.',
      industrial: 'Meubles avec cadres métalliques, cuir, bois sombre, esthétique matériaux bruts exposés.',
      scandinavian: 'Meubles en bois clair (chêne, bouleau), tissus neutres doux, textiles cosy, accessoires hygge.',
      contemporary: 'Tendances actuelles, matériaux mixtes, pièces statement audacieuses, palettes sophistiquées.',
      coastal: 'Meubles légers et aérés, textures naturelles (rotin, osier), palette bleu et blanc, décor balnéaire.',
      farmhouse: 'Meubles en bois rustique, pièces vintage, tons neutres chauds, charme campagnard.',
      midcentury: 'Formes iconiques 1950s-60s, courbes organiques, bois chaud, design ère atomique.',
      traditional: 'Meubles classiques élégants, bois riches (acajou, noyer), symétrie, tissus luxueux (velours, soie), moulures décoratives, pièces intemporelles.'
    };

    prompt += `

=== APPLICATION DU STYLE ===
GUIDE ${design_style.toUpperCase()}:
${styleGuides[design_style]}`;

    // SECTION 3: Budget Level Guidance
    if (budget_level) {
      const budgetGuides: Record<BudgetLevel, string> = {
        low: 'BUDGET: Meubles fonctionnels et accessibles, style IKEA. Pièces pratiques au design simple.',
        medium: 'STANDARD: Meubles milieu de gamme qualité, style West Elm / Crate & Barrel. Bonne facture, designs intemporels.',
        high: 'PREMIUM: Meubles haut de gamme, style Restoration Hardware. Matériaux supérieurs, pièces design.',
        luxury: 'LUXE: Pièces sur mesure et art de collection. Matériaux exclusifs, pièces de designer iconiques.'
      };
      prompt += `

${budgetGuides[budget_level]}`;
    }

    // SECTION 4: Seasonal Touches (Optional)
    if (season) {
      const seasonGuides: Record<SeasonType, string> = {
        spring: 'PRINTEMPS: Fleurs fraîches en vases, couleurs pastel en accent, textiles légers et aérés.',
        summer: 'ÉTÉ: Lumière naturelle vive, plantes tropicales, couleurs inspirées agrumes, tissus légers.',
        autumn: 'AUTOMNE: Tons terre chauds, plaids et couvertures cosy, arrangements de fleurs séchées, accents ambre/rouille.',
        winter: 'HIVER: Textiles superposés cosy, éclairage chaleureux, éléments végétaux persistants, palette froide élégante.',
        noel: 'NOËL: Décor festif élégant - sapin décoré (si espace), couronnes saisonnières, touches festives mais raffinées, éclairage chaleureux.'
      };
      prompt += `

=== TOUCHES SAISONNIÈRES ===
${seasonGuides[season]}
Gardez les éléments saisonniers subtils et élégants - c'est pour du staging immobilier, pas un catalogue de fêtes.`;
    }

    // SECTION 5: Output Requirements
    prompt += `

=== EXIGENCES DE SORTIE POUR L'IMMOBILIER ===

PHOTORÉALISME:
- Résultat indiscernable d'une vraie photo
- Meubles aux proportions et perspectives correctes
- Ombres et éclairage cohérents avec la photo originale
- Aucun objet flottant, aucun clipping

STAGING PROFESSIONNEL:
- Maintenir équilibre visuel et fluidité
- Ne pas surcharger l'espace
- Laisser passages clairs et zones fonctionnelles
- Attrait large pour acheteurs potentiels

PRÉCISION:
- Représenter fidèlement les dimensions RÉELLES
- Éléments architecturaux IDENTIQUES à l'original
- Sol EXACTEMENT comme en entrée
- Fenêtres et portes aux positions EXACTES

IDENTITÉ DE LA PIÈCE (RÈGLE ABSOLUE):
- Le résultat DOIT être reconnaissable comme LA MÊME PIÈCE
- C'est un RELOOKING, pas une RECONSTRUCTION
- Un observateur comparant avant/après doit pouvoir dire : "C'est la même pièce, mais redécorée"
- Si vous n'êtes pas sûr, préservez PLUS d'éléments architecturaux, pas moins`;

    return prompt;
  }

  /**
   * Redesign a single room image using Nano Banana Pro
   */
  async redesignRoom(input: RoomRedesignerInput): Promise<RoomRedesignerResult> {
    const startTime = Date.now();
    const imageSize = input.image_base64 ? Buffer.from(input.image_base64, 'base64').length : 0;

    try {
      logger.info('🎨 RoomRedesignerService.redesignRoom: Starting room redesign', {
        design_style: input.design_style,
        season: input.season,
        budget_level: input.budget_level,
        image_mime: input.image_mime,
        image_size_kb: Math.round(imageSize / 1024),
      });

      // Validate image format
      if (!input.image_base64 || input.image_base64.length === 0) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Invalid image format', {
          has_base64: !!input.image_base64,
          base64_length: input.image_base64?.length || 0,
        });
        throw new Error('Invalid image format');
      }

      // Validate API key
      if (!input.api_key) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Missing API key');
        throw new Error('Invalid API key');
      }

      // Build the redesign prompt
      const prompt = this.buildPrompt({
        design_style: input.design_style,
        season: input.season,
        budget_level: input.budget_level,
      });

      logger.info('📝 RoomRedesignerService.redesignRoom: Prompt generated', {
        prompt,
        prompt_length: prompt.length,
      });

      // Call Nano Banana Pro API (Gemini 3 Pro Image Preview)
      const endpoint = `${this.apiUrl}/${this.model}:generateContent`;
      logger.info('🚀 RoomRedesignerService.redesignRoom: Calling Nano Banana Pro API', {
        endpoint,
        model: this.model,
        has_input_image: !!input.image_base64,
        prompt_length: prompt.length,
      });

      // Google Gemini API format for image editing
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: input.image_mime || 'image/jpeg',
                  data: input.image_base64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['Image']
        }
      };

      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            'x-goog-api-key': input.api_key,
            'Content-Type': 'application/json',
          },
          timeout: 300000, // 5 minutes timeout (increased for complex images)
        }
      );

      const processingTime = Date.now() - startTime;

      // Extract image from Google Gemini response format
      // Response structure: { candidates: [{ content: { parts: [{ inlineData: { data: "base64..." } }] } }] }
      // Support both snake_case (inline_data) and camelCase (inlineData) for API compatibility
      const candidate = response.data?.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData || part.inline_data);
      const inlineData = imagePart?.inlineData || imagePart?.inline_data;
      const imageBase64 = inlineData?.data;

      if (!imageBase64) {
        logger.error('❌ RoomRedesignerService.redesignRoom: No image in response', {
          processing_time_ms: processingTime,
          has_candidates: !!response.data?.candidates,
          has_candidate: !!candidate,
          has_content: !!candidate?.content,
          has_parts: !!candidate?.content?.parts,
          parts_count: candidate?.content?.parts?.length,
          has_imagePart: !!imagePart,
          has_inlineData: !!inlineData,
          response_structure: JSON.stringify(response.data).substring(0, 500),
        });
        throw new Error('No image returned by API');
      }

      logger.info('✅ RoomRedesignerService.redesignRoom: Redesign successful', {
        processing_time_ms: processingTime,
        processing_time_sec: (processingTime / 1000).toFixed(2),
        has_result: true,
        result_size_kb: Math.round(Buffer.from(imageBase64, 'base64').length / 1024),
      });

      return {
        success: true,
        image_base64: imageBase64,
        processing_time: processingTime,
        prompt_used: prompt,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const processingTime = Date.now() - startTime;

      // Handle specific error cases
      if (axiosError.response?.status === 401) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Invalid API key', {
          status: 401,
          processing_time_ms: processingTime,
          processing_time_sec: (processingTime / 1000).toFixed(2),
          response_data: axiosError.response?.data,
        });
        throw new Error('Invalid API key');
      }

      if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        logger.error('❌ RoomRedesignerService.redesignRoom: Request timeout', {
          timeout_ms: 300000,
          processing_time_ms: processingTime,
          processing_time_sec: (processingTime / 1000).toFixed(2),
          error_code: axiosError.code,
        });
        throw new Error('Request timeout - the redesign process took too long');
      }

      logger.error('❌ RoomRedesignerService.redesignRoom: Redesign failed', {
        error_message: axiosError.message,
        error_code: axiosError.code,
        response_data: axiosError.response?.data,
        response_status: axiosError.response?.status,
        processing_time_ms: processingTime,
        processing_time_sec: (processingTime / 1000).toFixed(2),
        design_style: input.design_style,
        has_api_key: !!input.api_key,
      });

      throw error;
    }
  }

  /**
   * Process multiple rooms in batch
   * Supports unlimited batch sizes as per Room Redesigner specification
   */
  async batchRedesign(inputs: RoomRedesignerInput[]): Promise<RoomRedesignerResult[]> {
    logger.debug('🔍 RoomRedesignerService: Starting batch redesign', {
      batch_size: inputs.length,
    });

    const results: RoomRedesignerResult[] = [];

    // Process in parallel with concurrency limit
    const concurrency = 5; // Process 5 at a time
    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map((input) => this.redesignRoom(input))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Handle failure case
          results.push({
            success: false,
            error: result.reason.message || 'Unknown error',
          });
        }
      }

      logger.debug('📦 RoomRedesignerService: Batch progress', {
        processed: Math.min(i + concurrency, inputs.length),
        total: inputs.length,
      });
    }

    logger.debug('✅ RoomRedesignerService: Batch redesign complete', {
      total: inputs.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }
}

export default new RoomRedesignerService();
