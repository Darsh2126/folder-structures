export interface WrapperJson {
  tag: string;
  label: string;
  targets: string[];
  injects_into: string;
  root_files: string[];
  needs: string[];
  conflicts: string[];
  packages: {
    dependencies: string[];
    devDependencies: string[];
  };
  env_vars: string[];
  version: string;
}

export interface WrapperManifest {
  tag: string;
  label: string;
  targets: string[];
  needs: string[];
  conflicts: string[];
  packages: {
    dependencies: string[];
    devDependencies: string[];
  };
  env_vars: string[];
  version: string;
  filesDir: string;
  rootDir: string;
  wrapperJsonPath: string;
}

export interface ScaffoldLock {
  base: string;
  wrappers: {
    tag: string;
    version: string;
    instance?: string;
  }[];
  scaffoldedAt: string;
}

export interface BaseTemplate {
  name: string;
  label: string;
  dir: string;
}

export interface CliOptions {
  projectName?: string;
  template?: string;
  wrappers?: string[];
}
