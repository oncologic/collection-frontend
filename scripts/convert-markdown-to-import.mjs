#!/usr/bin/env node

/**
 * Utility script to convert markdown posts to bulk notation import format
 * 
 * Usage:
 *   node scripts/convert-markdown-to-import.js input.md output.json [title] [description]
 * 
 * Markdown Format:
 *   Each post should be in a section starting with ### Post X: Title
 *   Followed by metadata lines:
 *   **Date:** YYYY-MM-DD (description)
 *   **Time:** HH:MM AM/PM Timezone
 *   **Platforms:** Platform list
 *   **Assigned to:** Assignment info
 *   **Content:**
 *   [Post content here]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseTime = (timeStr) => {
  // Parse time like "10:00 AM Central" or "2:00 PM Central"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const parseDate = (dateStr) => {
  // Extract date from strings like "November 25, 2024 (Monday, week before Giving Tuesday)"
  // Try to find YYYY-MM-DD format first
  const isoMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  
  // Try to parse month name format
  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  
  const match = dateStr.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (match) {
    const month = months[match[1].toLowerCase()];
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  
  return null;
};

const parseMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const notations = [];
  let currentPost = null;
  let inContent = false;
  let contentLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of a new post
    if (line.startsWith('### Post')) {
      // Save previous post if exists
      if (currentPost) {
        currentPost.content = contentLines.join('\n').trim();
        notations.push(currentPost);
      }
      
      // Start new post
      const titleMatch = line.match(/###\s+Post\s+\d+:\s*(.+)/);
      currentPost = {
        title: titleMatch ? titleMatch[1] : line.replace('###', '').trim(),
        category: 'Action',
        status: 'Pending',
        visibility: 'private',
        highlighted: false,
        customFields: {}
      };
      contentLines = [];
      inContent = false;
      continue;
    }
    
    if (!currentPost) continue;
    
    // Parse metadata lines
    if (line.startsWith('**Date:**')) {
      const dateStr = line.replace('**Date:**', '').trim();
      const date = parseDate(dateStr);
      if (date) currentPost.date = date;
      continue;
    }
    
    if (line.startsWith('**Time:**')) {
      const timeStr = line.replace('**Time:**', '').trim();
      const time = parseTime(timeStr);
      if (time) {
        currentPost.startTime = time;
        // Extract timezone
        const tzMatch = timeStr.match(/\b(Central|Eastern|Pacific|Mountain|UTC)\b/i);
        if (tzMatch) {
          const tzMap = {
            'Central': 'America/Chicago',
            'Eastern': 'America/New_York',
            'Pacific': 'America/Los_Angeles',
            'Mountain': 'America/Denver',
            'UTC': 'UTC'
          };
          currentPost.timezone = tzMap[tzMatch[1]] || 'America/Chicago';
        } else {
          currentPost.timezone = 'America/Chicago';
        }
      }
      continue;
    }
    
    if (line.startsWith('**Platforms:**')) {
      const platforms = line.replace('**Platforms:**', '').trim();
      currentPost.customFields.platforms = platforms;
      continue;
    }
    
    if (line.startsWith('**Assigned to:**')) {
      const assigned = line.replace('**Assigned to:**', '').trim();
      currentPost.customFields.assignedTo = assigned;
      continue;
    }
    
    // Content section
    if (line === '**Content:**' || line === 'Content:') {
      inContent = true;
      continue;
    }
    
    // Horizontal rule ends post
    if (line === '---' && inContent) {
      currentPost.content = contentLines.join('\n').trim();
      notations.push(currentPost);
      currentPost = null;
      contentLines = [];
      inContent = false;
      continue;
    }
    
    // Collect content lines
    if (inContent) {
      contentLines.push(line);
    }
  }
  
  // Don't forget the last post
  if (currentPost) {
    currentPost.content = contentLines.join('\n').trim();
    notations.push(currentPost);
  }
  
  return notations;
};

const createImportFile = (notations, metadata = {}) => {
  return {
    version: '1.0.0',
    metadata: {
      title: metadata.title ?? 'Bulk Notation Import',
      createdBy: metadata.createdBy ?? 'System',
      createdAt: new Date().toISOString(),
      description: metadata.description ?? ''
    },
    notations
  };
};

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node convert-markdown-to-import.js <input.md> <output.json> [title] [description]');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const title = args[2] ?? 'Bulk Notation Import';
const description = args[3] ?? '';

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file "${inputFile}" not found`);
  process.exit(1);
}

const markdown = fs.readFileSync(inputFile, 'utf-8');
const notations = parseMarkdown(markdown);

if (notations.length === 0) {
  console.error('Error: No notations found in markdown file');
  process.exit(1);
}

const importData = createImportFile(notations, {
  title,
  description,
  createdBy: process.env.USER ?? 'Unknown'
});

fs.writeFileSync(outputFile, JSON.stringify(importData, null, 2));

console.log(`✅ Successfully converted ${notations.length} notations`);
console.log(`📄 Output written to: ${outputFile}`);

export { parseMarkdown, createImportFile };

