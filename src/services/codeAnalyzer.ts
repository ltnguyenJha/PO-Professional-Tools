import * as fs from 'fs';
import * as path from 'path';
import { ProjectScanSummary } from '../shared/messages';

const MAX_FILES_TO_SCAN = 400;
const MAX_FILE_SIZE = 512 * 1024;

export class CodeAnalyzer {
  public analyzeProject(projectPath: string): ProjectScanSummary {
    const files = this.collectFiles(projectPath).slice(0, MAX_FILES_TO_SCAN);

    const routes = new Set<string>();
    const apiEndpoints = new Set<string>();
    const sqlObjects = new Set<string>();

    for (const filePath of files) {
      const content = this.readFileSafely(filePath);
      if (!content) {
        continue;
      }

      this.extractRoutes(content, routes);
      this.extractApiEndpoints(content, apiEndpoints);
      this.extractSqlObjects(content, sqlObjects);
    }

    return {
      routes: [...routes].sort(),
      apiEndpoints: [...apiEndpoints].sort(),
      sqlObjects: [...sqlObjects].sort()
    };
  }

  private collectFiles(root: string): string[] {
    const result: string[] = [];
    const queue: string[] = [root];

    while (queue.length > 0 && result.length <= MAX_FILES_TO_SCAN * 2) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }

        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          queue.push(fullPath);
        } else if (this.isScannableFile(fullPath)) {
          result.push(fullPath);
        }
      }
    }

    return result;
  }

  private isScannableFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.cs',
      '.sql',
      '.json',
      '.md'
    ].includes(extension);
  }

  private readFileSafely(filePath: string): string | null {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_FILE_SIZE) {
        return null;
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  private extractRoutes(content: string, routes: Set<string>): void {
    const patterns = [
      /path\s*:\s*['"`]([^'"`]+)['"`]/g,
      /Route\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /@route\(\s*['"`]([^'"`]+)['"`]\s*\)/gi,
      /Map(?:Get|Post|Put|Delete)\(\s*['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of patterns) {
      let match = pattern.exec(content);
      while (match) {
        routes.add(match[1]);
        match = pattern.exec(content);
      }
    }
  }

  private extractApiEndpoints(content: string, apiEndpoints: Set<string>): void {
    const patterns = [
      /\[(HttpGet|HttpPost|HttpPut|HttpDelete)(?:\(\s*['"`]([^'"`]+)['"`]\s*\))?\]/g,
      /Map(Get|Post|Put|Delete)\(\s*['"`]([^'"`]+)['"`]/g,
      /(fetch|axios\.(get|post|put|delete))\(\s*['"`]([^'"`]+)['"`]/gi
    ];

    for (const pattern of patterns) {
      let match = pattern.exec(content);
      while (match) {
        const method = (match[1] || 'CALL').toUpperCase();
        const route = match[2] || match[3] || '';
        if (route) {
          apiEndpoints.add(`${method} ${route}`);
        }
        match = pattern.exec(content);
      }
    }
  }

  private extractSqlObjects(content: string, sqlObjects: Set<string>): void {
    const patterns = [
      /create\s+procedure\s+([\[\]\w.]+)/gi,
      /create\s+table\s+([\[\]\w.]+)/gi,
      /exec\s+([\[\]\w.]+)/gi
    ];

    for (const pattern of patterns) {
      let match = pattern.exec(content);
      while (match) {
        sqlObjects.add(match[1]);
        match = pattern.exec(content);
      }
    }
  }
}
