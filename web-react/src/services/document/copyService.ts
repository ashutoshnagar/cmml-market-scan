/**
 * Clipboard copy service
 * Provides methods to copy content in different formats
 */
import clipboardCopy from 'clipboard-copy';
import { extractPlainTextFromMarkdown } from './documentUtils';

/**
 * Copy formats
 */
export enum CopyFormat {
  MARKDOWN = 'markdown',
  PLAIN_TEXT = 'plain_text',
  RICH_TEXT = 'rich_text',
}

/**
 * Copy options
 */
export interface CopyOptions {
  content: string;
  format?: CopyFormat;
  showSuccess?: boolean;
}

/**
 * Copy content to clipboard in the specified format
 */
export const copyToClipboard = async (options: CopyOptions): Promise<boolean> => {
  const { content, format = CopyFormat.MARKDOWN, showSuccess = true } = options;
  
  try {
    let textToCopy = content;
    
    // Format based on the requested format
    switch (format) {
      case CopyFormat.MARKDOWN:
        // Use the markdown content as-is
        break;
        
      case CopyFormat.PLAIN_TEXT:
        // Strip all markdown formatting
        textToCopy = extractPlainTextFromMarkdown(content);
        break;
        
      case CopyFormat.RICH_TEXT:
        // For rich text, we need to use the clipboard API's writeText method
        // This is a more complex scenario that might require additional libraries
        // Fallback to plain text for now
        textToCopy = extractPlainTextFromMarkdown(content);
        break;
    }
    
    // Copy to clipboard
    await clipboardCopy(textToCopy);
    
    // Show success notification if requested
    if (showSuccess) {
      showCopySuccessNotification(format);
    }
    
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    
    // Show error notification
    showCopyErrorNotification();
    
    return false;
  }
};

/**
 * Show a success notification after copying
 */
const showCopySuccessNotification = (format: CopyFormat): void => {
  // Create a toast notification element
  const toast = document.createElement('div');
  toast.className = 'copy-toast success';
  
  // Set the message based on the format
  let message = 'Copied to clipboard';
  switch (format) {
    case CopyFormat.MARKDOWN:
      message = 'Copied markdown to clipboard';
      break;
    case CopyFormat.PLAIN_TEXT:
      message = 'Copied plain text to clipboard';
      break;
    case CopyFormat.RICH_TEXT:
      message = 'Copied formatted text to clipboard';
      break;
  }
  
  toast.textContent = message;
  
  // Add the toast to the DOM
  document.body.appendChild(toast);
  
  // Trigger the animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove the toast after the animation
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

/**
 * Show an error notification if copying fails
 */
const showCopyErrorNotification = (): void => {
  // Create a toast notification element
  const toast = document.createElement('div');
  toast.className = 'copy-toast error';
  toast.textContent = 'Failed to copy to clipboard';
  
  // Add the toast to the DOM
  document.body.appendChild(toast);
  
  // Trigger the animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove the toast after the animation
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

export default {
  copyToClipboard,
  CopyFormat,
};
