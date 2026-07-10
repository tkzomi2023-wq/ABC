import { useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Superscript, Subscript,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
};

const FORMAT_BUTTONS = [
  { cmd: 'bold', icon: Bold, label: 'Bold (Ctrl+B)' },
  { cmd: 'italic', icon: Italic, label: 'Italic (Ctrl+I)' },
  { cmd: 'underline', icon: Underline, label: 'Underline (Ctrl+U)' },
  { cmd: 'strikeThrough', icon: Strikethrough, label: 'Strikethrough' },
  { cmd: 'superscript', icon: Superscript, label: 'Superscript' },
  { cmd: 'subscript', icon: Subscript, label: 'Subscript' },
] as const;

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '12rem' }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = useCallback((openTag: string, closeTag: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + openTag + selected + closeTag + after;
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + openTag.length, end + openTag.length);
    });
  }, [value, onChange]);

  const handleFormat = useCallback((cmd: string) => {
    switch (cmd) {
      case 'bold': wrapSelection('<strong>', '</strong>'); break;
      case 'italic': wrapSelection('<em>', '</em>'); break;
      case 'underline': wrapSelection('<u>', '</u>'); break;
      case 'strikeThrough': wrapSelection('<s>', '</s>'); break;
      case 'superscript': wrapSelection('<sup>', '</sup>'); break;
      case 'subscript': wrapSelection('<sub>', '</sub>'); break;
    }
  }, [wrapSelection]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'b') { e.preventDefault(); handleFormat('bold'); }
    else if (key === 'i') { e.preventDefault(); handleFormat('italic'); }
    else if (key === 'u') { e.preventDefault(); handleFormat('underline'); }
  }, [handleFormat]);

  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5 pb-1.5 border-b border-slate-200">
        {FORMAT_BUTTONS.map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleFormat(cmd)}
            className="p-1.5 text-slate-600 hover:text-navy-700 hover:bg-slate-100 rounded-md transition-colors"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 select-none">
          Select text, then click a format button
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input-field resize-y"
        style={{ minHeight }}
      />
    </div>
  );
}
