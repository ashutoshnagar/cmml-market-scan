/**
 * Document utilities for generating and downloading documents
 */
import { saveAs } from 'file-saver';

// Define common types
export interface DocumentOptions {
  title: string;
  companyName: string;
  content: string;
  includeTimestamp?: boolean;
  includePageNumbers?: boolean;
}

/**
 * Generate a timestamp string for document naming
 */
export const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0].replace(/-/g, '') + 
         '-' + 
         now.toTimeString().split(' ')[0].replace(/:/g, '');
};

/**
 * Create a safe filename for downloads
 */
export const createSafeFilename = (companyName: string, extension: string): string => {
  // Clean company name for filename
  const safeCompanyName = companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = getTimestamp();
  return `${safeCompanyName}_report_${timestamp}.${extension}`;
};

/**
 * Extract the plain text content from markdown
 * Simple version - this could be enhanced with a proper markdown parser
 */
export const extractPlainTextFromMarkdown = (markdown: string): string => {
  return markdown
    // Remove headers
    .replace(/#+\s+(.*)/g, '$1')
    // Remove bold/italic
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]+)\]\([^)]+\)/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^\s*>\s+(.*)$/gm, '$1')
    // Remove horizontal rules
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    // Handle line breaks and paragraphs
    .replace(/\n{2,}/g, '\n\n');
};

/**
 * Helper function to convert markdown table to Word/PDF compatible format
 */
export const parseMarkdownTable = (tableText: string): { headers: string[], rows: string[][] } => {
  const lines = tableText.trim().split('\n');
  
  if (lines.length < 3) {
    return { headers: [], rows: [] };
  }
  
  // Parse headers
  const headerLine = lines[0];
  const headers = headerLine.split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);
  
  // Skip the separator line (line[1])
  
  // Parse rows
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const rowLine = lines[i];
    const rowCells = rowLine.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    
    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  }
  
  return { headers, rows };
};

/**
 * Save a blob as a file
 */
export const saveFile = (blob: Blob, filename: string): void => {
  saveAs(blob, filename);
};

/**
 * Shared color values based on Piramal Finance theme
 */
export const PIRAMAL_COLORS = {
  blue: '#1E4A73',
  blueLight: '#3678B8',
  blueLighter: '#E8F0F9',
  gold: '#F0B759',
  textPrimary: '#1A1A1A',
  textSecondary: '#6E6E6E',
};

export default {
  getTimestamp,
  createSafeFilename,
  extractPlainTextFromMarkdown,
  parseMarkdownTable,
  saveFile,
  PIRAMAL_COLORS
};
