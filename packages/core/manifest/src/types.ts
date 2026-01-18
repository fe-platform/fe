/**
 * MFE Manifest types for the FE platform
 * Defines the structure of fe.json manifests
 */

/**
 * Main MFE manifest structure (fe.json)
 */
export interface MfeManifest {
  /** MFE package name (e.g., "@myorg/my-mfe") */
  name: string;

  /** Semantic version */
  version: string;

  /** Human-readable description */
  description?: string;

  /** Main entry point (relative path from package root) */
  main: string;

  /** Framework used (react, vue, svelte, etc.) */
  framework?: string;

  /** Platform packages this MFE depends on */
  dependencies?: MfeDependencies;

  /** Permissions required by this MFE */
  permissions?: MfePermissions;

  /** Routes exposed by this MFE */
  routes?: MfeRoute[];

  /** Capabilities this MFE provides */
  capabilities?: MfeCapability[];

  /** AI context for catalog discovery */
  ai?: MfeAiContext;

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Platform package dependencies
 * Maps package name to version constraint
 */
export interface MfeDependencies {
  /** fe:state */
  "fe:state"?: string;

  /** fe:routing */
  "fe:routing"?: string;

  /** fe:net or fe:net/{org} */
  "fe:net"?: string;
  [key: `fe:net/${string}`]: string;

  /** fe:auth */
  "fe:auth"?: string;

  /** fe:i18n */
  "fe:i18n"?: string;

  /** fe:telemetry */
  "fe:telemetry"?: string;

  /** fe:visuals */
  "fe:visuals"?: string;

  /** fe:experimentation */
  "fe:experimentation"?: string;

  /** fe:test (dev only) */
  "fe:test"?: string;

  /** fe:plays/{org} */
  [key: `fe:plays/${string}`]: string;

  /** fe:scenes/{org} */
  [key: `fe:scenes/${string}`]: string;

  /** Other MFEs */
  [key: string]: string;
}

/**
 * Permission declarations
 */
export interface MfePermissions {
  /** State slices this MFE owns */
  state?: {
    owns?: string[];
    reads?: string[];
  };

  /** API endpoints this MFE can call */
  network?: {
    domains?: string[];
    paths?: string[];
  };

  /** Storage access */
  storage?: {
    localStorage?: boolean;
    sessionStorage?: boolean;
    cookies?: string[];
  };

  /** Browser APIs */
  apis?: string[];
}

/**
 * Route definition
 */
export interface MfeRoute {
  /** Route path pattern */
  path: string;

  /** Component to render */
  component: string;

  /** Route metadata */
  meta?: {
    title?: string;
    requiresAuth?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Capability declaration
 */
export interface MfeCapability {
  /** Capability ID */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description */
  description: string;

  /** Intent categories */
  intents?: string[];

  /** Example invocations */
  examples?: string[];
}

/**
 * AI context for catalog
 */
export interface MfeAiContext {
  /** Keywords for search */
  keywords?: string[];

  /** What this MFE does */
  summary?: string;

  /** Use cases */
  useCases?: string[];

  /** Related MFEs */
  related?: string[];
}

/**
 * Validation error
 */
export interface ManifestValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation result
 */
export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
}
