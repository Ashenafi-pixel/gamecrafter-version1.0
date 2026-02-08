/**
 * Project Management System for Animation Lab
 * Handles project saving, loading, import/export, and version control
 */

import { AssetManager, AssetMetadata } from './AssetManager';
import { SpriteManager, SpriteConfig } from './SpriteManager';
import { ImageAnalysisResult } from './ImageAnalyzer';
import { ProjectData, ProjectSettings, FormatConverter } from '../utils/FormatConverter';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from './ErrorHandler';

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  created: Date;
  modified: Date;
  version: string;
  size: number; // Size in bytes
  assetCount: number;
  spriteCount: number;
}

export interface SaveOptions {
  includeAssets: boolean;
  includeAnalysis: boolean;
  compress: boolean;
  generateThumbnail: boolean;
}

export interface LoadOptions {
  validateAssets: boolean;
  recreateSprites: boolean;
  preserveIds: boolean;
}

export class ProjectManager {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly STORAGE_PREFIX = 'animation_lab_project_';
  
  private assetManager: AssetManager;
  private spriteManager: SpriteManager;
  private errorHandler: ErrorHandler;
  private currentProject: ProjectData | null = null;
  private isModified: boolean = false;
  private autoSaveEnabled: boolean = true;
  private autoSaveInterval: number = 30000; // 30 seconds
  private autoSaveTimer?: NodeJS.Timeout;

  constructor(assetManager: AssetManager, spriteManager: SpriteManager) {
    this.assetManager = assetManager;
    this.spriteManager = spriteManager;
    this.errorHandler = ErrorHandler.getInstance();
    
    this.setupAutoSave();
  }

  /**
   * Create new project
   */
  createNewProject(name: string, description?: string): ProjectData {
    const project: ProjectData = {
      version: ProjectManager.CURRENT_VERSION,
      metadata: {
        name: name.trim(),
        description: description?.trim(),
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      assets: [],
      sprites: {},
      analyses: {},
      layers: [{
        id: 'default',
        name: 'Default Layer',
        sprites: [],
        visible: true,
        alpha: 1,
        locked: false
      }],
      settings: {
        canvasSize: { width: 800, height: 600 },
        backgroundColor: '#f8f9fa',
        gridEnabled: false,
        snapToGrid: false,
        gridSize: 20
      }
    };

    this.currentProject = project;
    this.isModified = false;
    
    return project;
  }

  /**
   * Save project to local storage
   */
  async saveProject(
    projectId?: string,
    options: SaveOptions = {
      includeAssets: true,
      includeAnalysis: true,
      compress: false,
      generateThumbnail: true
    }
  ): Promise<string> {
    if (!this.currentProject) {
      throw new Error('No project to save');
    }

    try {
      const id = projectId || this.generateProjectId();
      
      // Update project data
      this.currentProject.metadata.modified = new Date().toISOString();
      this.currentProject.assets = this.assetManager.getAllMetadata();
      this.currentProject.sprites = this.spriteManager.exportConfigurations();

      // Generate thumbnail if requested
      if (options.generateThumbnail) {
        this.currentProject.metadata.thumbnail = await this.generateProjectThumbnail();
      }

      // Convert to JSON
      const projectJson = FormatConverter.projectToJSON(this.currentProject);
      
      // Save to local storage
      const storageKey = ProjectManager.STORAGE_PREFIX + id;
      
      if (options.compress) {
        // Simple compression using JSON.stringify with reduced precision
        const compressed = this.compressProjectData(this.currentProject);
        localStorage.setItem(storageKey, JSON.stringify(compressed));
      } else {
        localStorage.setItem(storageKey, projectJson);
      }

      // Save project info separately for quick listing
      const projectInfo: ProjectInfo = {
        id,
        name: this.currentProject.metadata.name,
        description: this.currentProject.metadata.description,
        thumbnail: this.currentProject.metadata.thumbnail,
        created: new Date(this.currentProject.metadata.created),
        modified: new Date(this.currentProject.metadata.modified),
        version: this.currentProject.version,
        size: new Blob([projectJson]).size,
        assetCount: this.currentProject.assets.length,
        spriteCount: Object.keys(this.currentProject.sprites).length
      };

      localStorage.setItem(storageKey + '_info', JSON.stringify(projectInfo));

      this.isModified = false;
      
      console.log(`Project saved: ${this.currentProject.metadata.name} (${id})`);
      return id;

    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_SYSTEM,
        ErrorSeverity.ERROR,
        { projectName: this.currentProject.metadata.name }
      );
      throw error;
    }
  }

  /**
   * Load project from local storage
   */
  async loadProject(
    projectId: string,
    options: LoadOptions = {
      validateAssets: true,
      recreateSprites: true,
      preserveIds: true
    }
  ): Promise<ProjectData> {
    try {
      const storageKey = ProjectManager.STORAGE_PREFIX + projectId;
      const projectJson = localStorage.getItem(storageKey);
      
      if (!projectJson) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Parse project data
      let projectData: ProjectData;
      try {
        projectData = FormatConverter.projectFromJSON(projectJson);
      } catch {
        // Try decompression
        const compressed = JSON.parse(projectJson);
        projectData = this.decompressProjectData(compressed);
      }

      // Validate project structure
      const validation = FormatConverter.validateProjectData(projectData);
      if (!validation.valid) {
        throw new Error(`Invalid project format: ${validation.errors.join(', ')}`);
      }

      // Load assets if requested
      if (options.validateAssets) {
        await this.validateAndLoadAssets(projectData.assets);
      }

      // Recreate sprites if requested
      if (options.recreateSprites) {
        await this.recreateSprites(projectData.sprites);
      }

      this.currentProject = projectData;
      this.isModified = false;

      console.log(`Project loaded: ${projectData.metadata.name} (${projectId})`);
      return projectData;

    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_SYSTEM,
        ErrorSeverity.ERROR,
        { projectId }
      );
      throw error;
    }
  }

  /**
   * Export project to file
   */
  async exportProject(format: 'json' | 'zip' = 'json'): Promise<Blob> {
    if (!this.currentProject) {
      throw new Error('No project to export');
    }

    try {
      if (format === 'json') {
        const projectJson = FormatConverter.projectToJSON(this.currentProject);
        return new Blob([projectJson], { type: 'application/json' });
      } else {
        // ZIP export would require additional library
        throw new Error('ZIP export not yet implemented');
      }
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_SYSTEM,
        ErrorSeverity.ERROR,
        { format }
      );
      throw error;
    }
  }

  /**
   * Import project from file
   */
  async importProject(file: File): Promise<ProjectData> {
    try {
      const content = await this.readFileContent(file);
      
      let projectData: ProjectData;
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        projectData = FormatConverter.projectFromJSON(content);
      } else {
        throw new Error(`Unsupported file format: ${file.type}`);
      }

      // Validate imported data
      const validation = FormatConverter.validateProjectData(projectData);
      if (!validation.valid) {
        throw new Error(`Invalid project format: ${validation.errors.join(', ')}`);
      }

      // Update metadata
      projectData.metadata.modified = new Date().toISOString();
      
      this.currentProject = projectData;
      this.isModified = true;

      console.log(`Project imported: ${projectData.metadata.name}`);
      return projectData;

    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_SYSTEM,
        ErrorSeverity.ERROR,
        { fileName: file.name }
      );
      throw error;
    }
  }

  /**
   * Get list of saved projects
   */
  getProjectList(): ProjectInfo[] {
    const projects: ProjectInfo[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(ProjectManager.STORAGE_PREFIX) && key.endsWith('_info')) {
        try {
          const infoJson = localStorage.getItem(key);
          if (infoJson) {
            const info = JSON.parse(infoJson) as ProjectInfo;
            // Convert date strings back to Date objects
            info.created = new Date(info.created);
            info.modified = new Date(info.modified);
            projects.push(info);
          }
        } catch (error) {
          console.warn(`Failed to parse project info for key ${key}:`, error);
        }
      }
    }

    // Sort by modified date (newest first)
    return projects.sort((a, b) => b.modified.getTime() - a.modified.getTime());
  }

  /**
   * Delete project
   */
  deleteProject(projectId: string): boolean {
    try {
      const storageKey = ProjectManager.STORAGE_PREFIX + projectId;
      const infoKey = storageKey + '_info';
      
      localStorage.removeItem(storageKey);
      localStorage.removeItem(infoKey);
      
      console.log(`Project deleted: ${projectId}`);
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_SYSTEM,
        ErrorSeverity.ERROR,
        { projectId }
      );
      return false;
    }
  }

  /**
   * Duplicate project
   */
  async duplicateProject(projectId: string, newName: string): Promise<string> {
    try {
      const originalProject = await this.loadProject(projectId, {
        validateAssets: false,
        recreateSprites: false,
        preserveIds: true
      });

      // Create new project with modified metadata
      const duplicatedProject: ProjectData = {
        ...originalProject,
        metadata: {
          ...originalProject.metadata,
          name: newName,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      };

      this.currentProject = duplicatedProject;
      this.isModified = true;

      const newProjectId = await this.saveProject();
      console.log(`Project duplicated: ${newName} (${newProjectId})`);
      
      return newProjectId;
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_SYSTEM,
        ErrorSeverity.ERROR,
        { projectId, newName }
      );
      throw error;
    }
  }

  /**
   * Get current project
   */
  getCurrentProject(): ProjectData | null {
    return this.currentProject;
  }

  /**
   * Check if project is modified
   */
  isProjectModified(): boolean {
    return this.isModified;
  }

  /**
   * Mark project as modified
   */
  markAsModified(): void {
    this.isModified = true;
  }

  /**
   * Enable/disable auto-save
   */
  setAutoSave(enabled: boolean, interval: number = 30000): void {
    this.autoSaveEnabled = enabled;
    this.autoSaveInterval = interval;
    
    if (enabled) {
      this.setupAutoSave();
    } else {
      this.clearAutoSave();
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalProjects: number;
    totalSize: number;
    usedSpace: number;
    availableSpace: number;
  } {
    const projects = this.getProjectList();
    const totalSize = projects.reduce((sum, project) => sum + project.size, 0);
    
    // Estimate used storage (localStorage is usually 5-10MB limit)
    let usedSpace = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        usedSpace += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding
      }
    }

    const estimatedLimit = 5 * 1024 * 1024; // 5MB estimate
    
    return {
      totalProjects: projects.length,
      totalSize,
      usedSpace,
      availableSpace: Math.max(0, estimatedLimit - usedSpace)
    };
  }

  // Private methods

  private generateProjectId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateProjectThumbnail(): Promise<string> {
    // Generate a simple thumbnail from current canvas state
    // This is a placeholder - real implementation would capture canvas
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }

  private compressProjectData(data: ProjectData): any {
    // Simple compression - remove unnecessary precision and empty fields
    return {
      ...data,
      sprites: Object.fromEntries(
        Object.entries(data.sprites).map(([id, config]) => [
          id,
          {
            ...config,
            position: {
              x: Math.round(config.position.x * 100) / 100,
              y: Math.round(config.position.y * 100) / 100
            },
            scale: {
              x: Math.round(config.scale.x * 100) / 100,
              y: Math.round(config.scale.y * 100) / 100
            },
            rotation: Math.round(config.rotation * 1000) / 1000
          }
        ])
      )
    };
  }

  private decompressProjectData(compressed: any): ProjectData {
    // Reverse of compression - data should be compatible
    return compressed as ProjectData;
  }

  private async validateAndLoadAssets(assets: AssetMetadata[]): Promise<void> {
    // Validate that assets still exist and are accessible
    for (const asset of assets) {
      if (!this.assetManager.getTexture(asset.id)) {
        console.warn(`Asset ${asset.id} (${asset.name}) not found in asset manager`);
      }
    }
  }

  private async recreateSprites(sprites: Record<string, SpriteConfig>): Promise<void> {
    // Recreate sprites in sprite manager
    for (const [id, config] of Object.entries(sprites)) {
      try {
        if (!this.spriteManager.getSprite(id)) {
          this.spriteManager.createSprite(id, config.assetId, config);
        }
      } catch (error) {
        console.warn(`Failed to recreate sprite ${id}:`, error);
      }
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private setupAutoSave(): void {
    this.clearAutoSave();
    
    if (this.autoSaveEnabled) {
      this.autoSaveTimer = setInterval(() => {
        if (this.currentProject && this.isModified) {
          this.saveProject().catch(error => {
            console.warn('Auto-save failed:', error);
          });
        }
      }, this.autoSaveInterval);
    }
  }

  private clearAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearAutoSave();
  }
}