/**
 * Tests unitaires pour les fonctions utilitaires de formatage
 * @file formatting.test.js
 *
 * Exemples de tests pour des fonctions utilitaires pures.
 */

import { describe, it, expect } from 'vitest';

// NOTE: Ces sont des exemples de fonctions. Créez vos propres fonctions utilitaires.

// Fonctions exemples (à créer dans utils/formatting.js)
function formatCurrency(amount, currency = 'EUR') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(date, format = 'short') {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    return 'Date invalide';
  }

  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
  }[format] || options.short;

  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

describe('Formatting Utils', () => {
  describe('formatCurrency', () => {
    it('devrait formater un nombre en euros', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('1\u202f234,56\u00a0€');
    });

    it('devrait formater avec une autre devise', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toBe('1\u202f234,56\u00a0$US');
    });

    it('devrait gérer les nombres négatifs', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-100');
    });

    it('devrait gérer zéro', () => {
      const result = formatCurrency(0);
      expect(result).toBe('0,00\u00a0€');
    });

    it('devrait retourner N/A pour les valeurs invalides', () => {
      expect(formatCurrency(null)).toBe('N/A');
      expect(formatCurrency(undefined)).toBe('N/A');
      expect(formatCurrency('invalid')).toBe('N/A');
      expect(formatCurrency(NaN)).toBe('N/A');
    });
  });

  describe('formatDate', () => {
    it('devrait formater une date au format court', () => {
      const date = new Date('2024-03-15T10:30:00');
      const result = formatDate(date);
      expect(result).toBe('15/03/2024');
    });

    it('devrait formater une date au format long', () => {
      const date = new Date('2024-03-15T10:30:00');
      const result = formatDate(date, 'long');
      expect(result).toContain('15');
      expect(result).toContain('mars');
      expect(result).toContain('2024');
    });

    it('devrait formater uniquement l\'heure', () => {
      const date = new Date('2024-03-15T10:30:00');
      const result = formatDate(date, 'time');
      expect(result).toBe('10:30');
    });

    it('devrait gérer les dates invalides', () => {
      expect(formatDate(null)).toBe('Date invalide');
      expect(formatDate(undefined)).toBe('Date invalide');
      expect(formatDate(new Date('invalid'))).toBe('Date invalide');
    });
  });

  describe('truncateText', () => {
    it('devrait tronquer un texte long', () => {
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
      const result = truncateText(text, 20);
      expect(result).toBe('Lorem ipsum dolor si...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('devrait ne pas tronquer un texte court', () => {
      const text = 'Hello';
      const result = truncateText(text, 10);
      expect(result).toBe('Hello');
    });

    it('devrait gérer la longueur exacte', () => {
      const text = 'Hello World';
      const result = truncateText(text, 11);
      expect(result).toBe('Hello World');
    });

    it('devrait utiliser 50 par défaut', () => {
      const text = 'a'.repeat(100);
      const result = truncateText(text);
      expect(result).toBe('a'.repeat(50) + '...');
    });

    it('devrait gérer les valeurs invalides', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText(123)).toBe('');
      expect(truncateText('')).toBe('');
    });
  });
});

/**
 * BONNES PRATIQUES POUR LES TESTS DE FONCTIONS UTILITAIRES
 *
 * 1. Tester les cas normaux (happy path)
 * 2. Tester les cas limites (edge cases)
 *    - null, undefined, 0, '', [], {}
 *    - Valeurs très grandes ou très petites
 *    - Chaînes vides ou trop longues
 *
 * 3. Tester les erreurs attendues
 *    expect(() => myFunction(invalid)).toThrow()
 *
 * 4. Utiliser des tests paramétrés pour les variations
 *    it.each([
 *      [input1, expected1],
 *      [input2, expected2],
 *    ])('should format %s as %s', (input, expected) => {
 *      expect(format(input)).toBe(expected)
 *    })
 *
 * 5. Garder les tests simples et lisibles
 *    Une fonction = une responsabilité = des tests clairs
 */
