// src/env.d.ts

/// <reference types="astro/client" />

declare global {
    interface Window {
      toggleTheme: () => void; // Declares that toggleTheme exists on Window and is a function that takes no arguments and returns nothing (void).
    }
  }