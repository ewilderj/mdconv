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
  /** Preferences accessible in the `diagnose-clipboard` command */
  export type DiagnoseClipboard = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `convert-clipboard` command */
  export type ConvertClipboard = {}
  /** Arguments passed to the `diagnose-clipboard` command */
  export type DiagnoseClipboard = {}
}

