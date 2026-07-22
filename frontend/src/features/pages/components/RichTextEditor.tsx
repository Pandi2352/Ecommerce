import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  Undo2,
  Redo2,
  Eraser,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolItem {
  icon: typeof Bold;
  title: string;
  run: () => void;
}

/**
 * Minimal dependency-free WYSIWYG built on contentEditable + execCommand.
 * Emits sanitised-on-the-server HTML via onChange. Good enough for CMS copy
 * (headings, emphasis, lists, links, quotes) without pulling in a heavy editor.
 */
export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value in only when it diverges and the editor isn't focused,
  // so we never fight the caret while the user is typing.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML ?? '');

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Link URL (https://…)');
    if (url) exec('createLink', url);
  };

  const groups: ToolItem[][] = [
    [
      { icon: Bold, title: 'Bold', run: () => exec('bold') },
      { icon: Italic, title: 'Italic', run: () => exec('italic') },
    ],
    [
      { icon: Heading2, title: 'Heading', run: () => exec('formatBlock', 'H2') },
      { icon: Heading3, title: 'Subheading', run: () => exec('formatBlock', 'H3') },
      { icon: Quote, title: 'Quote', run: () => exec('formatBlock', 'BLOCKQUOTE') },
    ],
    [
      { icon: List, title: 'Bullet list', run: () => exec('insertUnorderedList') },
      { icon: ListOrdered, title: 'Numbered list', run: () => exec('insertOrderedList') },
    ],
    [
      { icon: Link2, title: 'Insert link', run: addLink },
      { icon: Eraser, title: 'Clear formatting', run: () => exec('removeFormat') },
    ],
    [
      { icon: Undo2, title: 'Undo', run: () => exec('undo') },
      { icon: Redo2, title: 'Redo', run: () => exec('redo') },
    ],
  ];

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {/* Toolbar — onMouseDown+preventDefault keeps the editor selection intact */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-bg/50 p-1">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1 h-4 w-px bg-border" />}
            {group.map((t) => (
              <button
                key={t.title}
                type="button"
                title={t.title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={t.run}
                className="grid h-7 w-7 place-items-center rounded text-text-secondary hover:bg-bg hover:text-text"
              >
                <t.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className={cn(
          'cms-editor min-h-52 max-h-[28rem] overflow-y-auto px-3 py-2.5 text-sm text-text outline-none',
          'empty:before:pointer-events-none empty:before:text-text-muted empty:before:content-[attr(data-placeholder)]',
          '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold',
          '[&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-base [&_h3]:font-semibold',
          '[&_p]:mb-2 [&_p]:leading-relaxed',
          '[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_a]:text-info [&_a]:underline',
          '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary',
        )}
      />
    </div>
  );
}
