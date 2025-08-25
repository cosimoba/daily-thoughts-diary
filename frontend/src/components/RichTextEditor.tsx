import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon,
  CodeBracketIcon,
  ListBulletIcon,
  NumberedListIcon,
  QuoteIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  maxHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
  autoFocus?: boolean;
}

export interface RichTextEditorRef {
  focus: () => void;
  getWordCount: () => number;
  getCharCount: () => number;
  insertText: (text: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = "Start writing your thoughts...",
  className,
  disabled = false,
  minHeight = "200px",
  maxHeight = "500px",
  onImageUpload,
  autoFocus = false
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorRef.current?.focus();
    },
    getWordCount: () => wordCount,
    getCharCount: () => charCount,
    insertText: (text: string) => {
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          updateContent();
        }
      }
    }
  }));

  // Update word and character counts
  const updateCounts = (text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    const words = plainText ? plainText.split(/\s+/).length : 0;
    const chars = plainText.length;
    setWordCount(words);
    setCharCount(chars);
  };

  // Update content and trigger onChange
  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      const plainText = editorRef.current.innerText || '';
      onChange(content);
      updateCounts(plainText);
    }
  };

  // Format text commands
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  // Check if command is active
  const isCommandActive = (command: string) => {
    return document.queryCommandState(command);
  };

  // Handle paste to clean formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      try {
        const imageUrl = await onImageUpload(file);
        formatText('insertImage', imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  // Handle key combinations
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'Enter':
          e.preventDefault();
          formatText('insertLineBreak');
          break;
      }
    }
  };

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      updateCounts(editorRef.current.innerText || '');
    }
  }, [value]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const toolbarButtons = [
    {
      icon: BoldIcon,
      command: 'bold',
      tooltip: 'Bold (Ctrl+B)',
      active: isCommandActive('bold')
    },
    {
      icon: ItalicIcon,
      command: 'italic',
      tooltip: 'Italic (Ctrl+I)',
      active: isCommandActive('italic')
    },
    {
      icon: UnderlineIcon,
      command: 'underline',
      tooltip: 'Underline (Ctrl+U)',
      active: isCommandActive('underline')
    },
    {
      icon: CodeBracketIcon,
      command: 'formatBlock',
      value: 'pre',
      tooltip: 'Code Block',
      active: isCommandActive('formatBlock')
    },
    {
      icon: ListBulletIcon,
      command: 'insertUnorderedList',
      tooltip: 'Bullet List',
      active: isCommandActive('insertUnorderedList')
    },
    {
      icon: NumberedListIcon,
      command: 'insertOrderedList',
      tooltip: 'Numbered List',
      active: isCommandActive('insertOrderedList')
    },
    {
      icon: QuoteIcon,
      command: 'formatBlock',
      value: 'blockquote',
      tooltip: 'Quote',
      active: isCommandActive('formatBlock')
    }
  ];

  return (
    <div className={clsx(
      'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200',
      isFocused && 'ring-2 ring-primary-500 border-primary-500 dark:ring-primary-400 dark:border-primary-400',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={() => formatText(button.command, button.value)}
              disabled={disabled}
              className={clsx(
                'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                button.active && 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
              )}
              title={button.tooltip}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Image upload */}
        {onImageUpload && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Insert Image"
            >
              <PhotoIcon className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </>
        )}

        {/* Link button */}
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) formatText('createLink', url);
          }}
          disabled={disabled}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={updateContent}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className={clsx(
          'p-4 outline-none text-gray-900 dark:text-gray-100 leading-relaxed',
          'prose prose-sm max-w-none',
          'prose-headings:text-gray-900 dark:prose-headings:text-gray-100',
          'prose-p:text-gray-700 dark:prose-p:text-gray-300',
          'prose-strong:text-gray-900 dark:prose-strong:text-gray-100',
          'prose-code:bg-gray-100 dark:prose-code:bg-gray-700',
          'prose-blockquote:border-primary-500 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400'
        )}
        style={{ 
          minHeight, 
          maxHeight, 
          overflowY: 'auto' 
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        
        {isFocused && (
          <div className="text-primary-600 dark:text-primary-400">
            Writing mode - Press Esc to exit
          </div>
        )}
      </div>

      {/* Empty state styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgb(156 163 175);
          font-style: italic;
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;