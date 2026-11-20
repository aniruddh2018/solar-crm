import { describe, expect, it } from 'vitest';
import { findDcrNumber } from './dcrExtraction';

describe('findDcrNumber', () => {
  it('extracts an explicitly labelled DCR certificate number', () => {
    expect(findDcrNumber('Domestic Content Requirement\nDCR Certificate No: DCR/2026/IN-00421')).toBe('DCR/2026/IN-00421');
  });

  it('extracts a certificate number and ignores trailing punctuation', () => {
    expect(findDcrNumber('Certificate Number - MNRE.PV.98765, issued in India')).toBe('MNRE.PV.98765');
  });

  it('does not guess when no labelled number exists', () => {
    expect(findDcrNumber('This module complies with domestic content requirements.')).toBeNull();
  });
});
