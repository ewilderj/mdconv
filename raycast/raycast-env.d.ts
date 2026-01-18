/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Image Handling - How to handle images during conversion */
  "imageHandling": "preserve" | "preserve-external-only" | "remove"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `convert-clipboard` command */
  export type ConvertClipboard = ExtensionPreferences & {}
  /** Preferences accessible in the `convert-clipboard-org` command */
  export type ConvertClipboardOrg = ExtensionPreferences & {}
  /** Preferences accessible in the `convert-to-html` command */
  export type ConvertToHtml = ExtensionPreferences & {}
  /** Preferences accessible in the `convert-to-google-docs` command */
  export type ConvertToGoogleDocs = ExtensionPreferences & {}
  /** Preferences accessible in the `convert-to-word` command */
  export type ConvertToWord = ExtensionPreferences & {}
  /** Preferences accessible in the `convert-to-slack` command */
  export type ConvertToSlack = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `convert-clipboard` command */
  export type ConvertClipboard = {}
  /** Arguments passed to the `convert-clipboard-org` command */
  export type ConvertClipboardOrg = {}
  /** Arguments passed to the `convert-to-html` command */
  export type ConvertToHtml = {}
  /** Arguments passed to the `convert-to-google-docs` command */
  export type ConvertToGoogleDocs = {}
  /** Arguments passed to the `convert-to-word` command */
  export type ConvertToWord = {}
  /** Arguments passed to the `convert-to-slack` command */
  export type ConvertToSlack = {}
}

