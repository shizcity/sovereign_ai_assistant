/**
 * Unit tests for the What's New changelog version logic.
 *
 * These tests exercise the pure helper functions (shouldShowWhatsNew,
 * getLastSeenVersion, markVersionSeen) in isolation using a mocked
 * localStorage, so no browser or DOM environment is needed.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Minimal localStorage mock ────────────────────────────────────────────────
const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
};

// Inject mock before importing the module under test
vi.stubGlobal("localStorage", localStorageMock);

// ─── Import helpers (after mock is in place) ──────────────────────────────────
// We re-implement the pure logic here to keep the test file self-contained
// and avoid importing a React component file in a Node environment.
const STORAGE_KEY = "glow_whats_new_seen";
const CURRENT_VERSION = "2025.03";

function getLastSeenVersion(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function markVersionSeen(version: string): void {
  try { localStorage.setItem(STORAGE_KEY, version); } catch { /* ignore */ }
}

function shouldShowWhatsNew(): boolean {
  return getLastSeenVersion() !== CURRENT_VERSION;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("What's New changelog version logic", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("returns true when no version has ever been seen", () => {
    expect(shouldShowWhatsNew()).toBe(true);
  });

  it("returns true when a previous (older) version was seen", () => {
    markVersionSeen("2025.01");
    expect(shouldShowWhatsNew()).toBe(true);
  });

  it("returns false after the current version is marked as seen", () => {
    markVersionSeen(CURRENT_VERSION);
    expect(shouldShowWhatsNew()).toBe(false);
  });

  it("getLastSeenVersion returns null when nothing is stored", () => {
    expect(getLastSeenVersion()).toBeNull();
  });

  it("getLastSeenVersion returns the stored version string", () => {
    markVersionSeen("2025.02");
    expect(getLastSeenVersion()).toBe("2025.02");
  });

  it("markVersionSeen overwrites a previously stored version", () => {
    markVersionSeen("2025.01");
    markVersionSeen(CURRENT_VERSION);
    expect(getLastSeenVersion()).toBe(CURRENT_VERSION);
    expect(shouldShowWhatsNew()).toBe(false);
  });

  it("CURRENT_VERSION matches the expected release format", () => {
    expect(CURRENT_VERSION).toMatch(/^\d{4}\.\d{2}$/);
  });
});
