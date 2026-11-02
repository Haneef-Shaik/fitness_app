import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateBrand } from '../brand.mjs';
import { readJson, readText } from './helpers.mjs';

const provisional = Object.freeze({
  appName: 'FitLog',
  nameStatus: 'provisional',
  decision: 'DEC-01',
  clearanceEvidence: null,
});
const noEvidence = Object.freeze({ readEvidence: () => null });
const record = 'docs/evidence/DS-6/clearance.md';

describe('validateBrand', () => {
  it('ships the working name as provisional with no clearance claimed', () => {
    const config = readJson('apps/mobile/scripts/store-art/brand.config.json');
    assert.deepEqual(config, provisional);
  });

  it('accepts the provisional working name and reports clearance as unproved', () => {
    assert.deepEqual(validateBrand(provisional, noEvidence), {
      appName: 'FitLog',
      nameStatus: 'provisional',
      decision: 'DEC-01',
      clearanceEvidence: null,
      trademarkClearance: 'unproved',
    });
  });

  it('refuses to mark a name cleared without an evidence record', () => {
    assert.throws(() => validateBrand({ ...provisional, nameStatus: 'cleared' }, noEvidence), /clearanceEvidence/);
  });

  it('refuses cleared when the cited evidence file does not exist', () => {
    assert.throws(
      () => validateBrand({ ...provisional, nameStatus: 'cleared', clearanceEvidence: record }, noEvidence),
      /does not exist/,
    );
  });

  it('refuses evidence outside docs/evidence', () => {
    for (const path of ['../secrets.md', 'docs/evidence/../../secrets.md', 'docs/notes.md', 'docs/evidence/DS-6/x.txt']) {
      assert.throws(
        () =>
          validateBrand(
            { ...provisional, nameStatus: 'cleared', clearanceEvidence: path },
            { readEvidence: () => 'DEC-01 FitLog' },
          ),
        /docs\/evidence/,
        path,
      );
    }
  });

  it('refuses evidence without the structured clearance line for the exact name', () => {
    for (const text of [
      'Trademark search for FitLog',
      'DEC-01 · FitLog · UNPROVED',
      'DEC-01 clearance: FitLogs · cleared 2026-11-01 · Example reviewer',
      'DEC-01 clearance: FitLog · cleared soon · Example reviewer',
      'DEC-01 clearance: FitLog · cleared 2026-11-01 · ',
      '> DEC-01 clearance: FitLog · cleared 2026-11-01 · Example reviewer',
    ]) {
      assert.throws(
        () =>
          validateBrand(
            { ...provisional, nameStatus: 'cleared', clearanceEvidence: record },
            { readEvidence: () => text },
          ),
        /must contain the line "DEC-01 clearance: FitLog/,
        text,
      );
    }
  });

  it('refuses the DS-6 brand-clearance status file, which records the gap and not a clearance', () => {
    const statusFile = 'docs/evidence/DS-6/brand-clearance.md';
    assert.throws(
      () =>
        validateBrand(
          { ...provisional, nameStatus: 'cleared', clearanceEvidence: statusFile },
          { readEvidence: (path) => (path === statusFile ? readText(statusFile) : null) },
        ),
      /must contain the line/,
    );
  });

  it('accepts cleared only with a matching clearance line, and says it is recorded, not cleared by this tool', () => {
    const evidence = '# Clearance\n\nDEC-01 clearance: FitLog · cleared 2026-11-01 · Example reviewer (fixture)\n';
    const brand = validateBrand(
      { ...provisional, nameStatus: 'cleared', clearanceEvidence: record },
      { readEvidence: (path) => (path === record ? evidence : null) },
    );
    assert.equal(brand.trademarkClearance, 'recorded');
    assert.equal(brand.clearanceEvidence, record);
  });

  it('escapes regular-expression characters in the name', () => {
    const name = 'Fit.Log+';
    assert.throws(
      () =>
        validateBrand(
          { ...provisional, appName: name, nameStatus: 'cleared', clearanceEvidence: record },
          { readEvidence: () => 'DEC-01 clearance: FitXLogg · cleared 2026-11-01 · Example reviewer' },
        ),
      /must contain the line/,
    );
  });

  it('refuses a provisional name that cites evidence', () => {
    assert.throws(() => validateBrand({ ...provisional, clearanceEvidence: record }, noEvidence), /provisional/);
  });

  for (const appName of ['', ' FitLog', 'FitLog ', 'x'.repeat(31), 'Fit<Log>', 42]) {
    it(`rejects the app name ${JSON.stringify(appName)}`, () => {
      assert.throws(() => validateBrand({ ...provisional, appName }, noEvidence), /appName/);
    });
  }

  it('accepts a 30-character name, the store title limit', () => {
    assert.equal(validateBrand({ ...provisional, appName: 'A'.repeat(30) }, noEvidence).appName.length, 30);
  });

  it('refuses unknown keys', () => {
    assert.throws(() => validateBrand({ ...provisional, cleared: true }, noEvidence), /unknown keys: cleared/);
  });

  it('refuses a decision other than DEC-01', () => {
    assert.throws(() => validateBrand({ ...provisional, decision: 'DEC-02' }, noEvidence), /DEC-01/);
  });

  it('refuses an unknown status', () => {
    assert.throws(() => validateBrand({ ...provisional, nameStatus: 'approved' }, noEvidence), /nameStatus/);
  });

  it('refuses a config that is not an object', () => {
    assert.throws(() => validateBrand(null, noEvidence), /JSON object/);
    assert.throws(() => validateBrand(['FitLog'], noEvidence), /JSON object/);
  });
});
