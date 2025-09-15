import { PROOF_VAULT_ARTIFACTS, ArtifactConfig } from '../config/artifacts';

export class FileValidator {
  static validateFile(file: File, categoryId: string, artifactId?: string) {
    // Single file validation (when artifact selected)
    if (artifactId) {
      const category = (PROOF_VAULT_ARTIFACTS as any)[categoryId];
      const artifact = category?.artifacts[artifactId];
      if (!artifact) return { valid: false, errors: ["Invalid artifact type"] };
      return this.validateAgainstArtifact(file, artifact as ArtifactConfig);
    }
    
    // Folder upload validation (check against all artifacts in category)
    const category = (PROOF_VAULT_ARTIFACTS as any)[categoryId];
    if (!category) return { valid: false, errors: ["Invalid category"] };
    
    const matchingArtifacts = Object.values(category.artifacts).filter((artifact: any) =>
      artifact.allowedFormats.some((format: string) => 
        file.name.toLowerCase().endsWith(format.toLowerCase())
      )
    ) as ArtifactConfig[];
    
    if (matchingArtifacts.length === 0) {
      return { 
        valid: false, 
        errors: [`File type not allowed in ${category.name} folder`] 
      };
    }
    
    // Validate against most permissive matching artifact
    const artifact = matchingArtifacts.sort((a, b) => b.maxSizeBytes - a.maxSizeBytes)[0];
    return this.validateAgainstArtifact(file, artifact);
  }
  
  static validateAgainstArtifact(file: File, artifact: ArtifactConfig) {
    const errors = [];
    
    // Format validation
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!artifact.allowedFormats.includes(extension)) {
      errors.push(`Invalid format. Allowed: ${artifact.allowedFormats.join(', ')}`);
    }
    
    // Size validation
    if (file.size > artifact.maxSizeBytes) {
      const maxSizeMB = Math.round(artifact.maxSizeBytes / (1024 * 1024));
      errors.push(`File too large. Max: ${maxSizeMB}MB`);
    }
    
    return { 
      valid: errors.length === 0, 
      errors,
      matchedArtifact: artifact 
    };
  }
  
  static getArtifactsForCategory(categoryId: string) {
    const category = (PROOF_VAULT_ARTIFACTS as any)[categoryId];
    if (!category) return [];
    
    return Object.entries(category.artifacts).map(([id, config]) => ({
      id,
      ...(config as ArtifactConfig)
    }));
  }
  
  static formatFileSize(bytes: number) {
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  }
  
  static getCategoryList() {
    return Object.entries(PROOF_VAULT_ARTIFACTS).map(([id, config]) => ({
      id,
      ...config
    }));
  }
}