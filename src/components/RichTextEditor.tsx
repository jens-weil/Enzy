"use client";

import { useEditor, EditorContent, Extension, Node, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Youtube } from "@tiptap/extension-youtube";
import { TextAlign } from "@tiptap/extension-text-align";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Heading } from "@tiptap/extension-heading";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, Link as LinkIcon, 
  Image as ImageIcon, Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, 
  PlayCircle, Indent, Outdent, Palette,
  Eraser, Maximize2, Loader2, Columns2, Columns3,
  Trash2, Plus, GripVertical
} from "lucide-react";
import { forwardRef, useImperativeHandle, useState, useCallback, useRef, useEffect, useMemo } from "react";

// --- UTILS ---

const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
};

// --- RESIZABLE MEDIA COMPONENT ---

const ResizableMedia = ({ node, updateAttributes, children, extension, selected }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [isLoaded, setIsLoaded] = useState(false);

  const mediaKey = node.attrs.src || node.attrs.videoId || "static-media";
  const content = useMemo(() => children, [mediaKey]);

  const updateInitialState = useCallback(() => {
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width && height) {
            if (extension.name === 'resizableImage') {
                setAspectRatio(width / height);
            } else {
                setAspectRatio(16 / 9);
            }
        }
    }
  }, [extension.name]);

  useEffect(() => {
    updateInitialState();
    const timer = setTimeout(updateInitialState, 500);
    return () => clearTimeout(timer);
  }, [updateInitialState]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth || 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + deltaX);
      const newHeight = newWidth / aspectRatio;

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.width = `${newWidth}px`;
          containerRef.current.style.height = `${newHeight}px`;
        }
        if (hudRef.current) {
          hudRef.current.innerText = `${Math.round(newWidth)} × ${Math.round(newHeight)}`;
        }
      });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      
      if (containerRef.current) {
        const currentWidth = containerRef.current.offsetWidth;
        updateAttributes({
          width: `${currentWidth}px`,
          height: `${currentWidth / aspectRatio}px`,
        });
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [aspectRatio, updateAttributes]);

  const isVideo = extension.name === 'resizableYoutube' || extension.name === 'iframe';
  const showHandles = selected || isResizing;

  // Alignment Logic
  const textAlign = node.attrs.textAlign || 'left';
  const indent = node.attrs.indent || 0;
  
  const alignmentClass = textAlign === 'center' ? 'mx-auto' : textAlign === 'right' ? 'ml-auto mr-0' : 'mr-auto ml-0';

  return (
    <NodeViewWrapper 
      draggable="true" 
      data-drag-handle 
      className={`relative group block max-w-full my-8 ${alignmentClass} ${isResizing ? "z-[200]" : "z-10"}`}
      style={{
          marginLeft: textAlign === 'left' ? `${indent * 2}rem` : undefined,
          textAlign: textAlign as any
      }}
    >
      <div 
        ref={containerRef}
        className={`relative transition-all duration-300 ${showHandles ? "ring-4 ring-brand-teal ring-offset-4 dark:ring-offset-slate-900 shadow-2xl scale-[1.01]" : "hover:ring-2 hover:ring-gray-200 dark:hover:ring-slate-700"} rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-800 ${alignmentClass}`}
        style={{ 
            width: node.attrs.width || "100%", 
            height: node.attrs.height || "auto",
            aspectRatio: (isVideo && (!node.attrs.height || node.attrs.height === 'auto')) ? "16 / 9" : undefined,
            minHeight: isVideo ? "180px" : undefined
        }}
      >
        {!isLoaded && isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-800 z-10 pointer-events-none">
                <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
            </div>
        )}

        <div className="w-full h-full" onLoad={() => setIsLoaded(true)}>
            {content}
        </div>
        
        <div className="absolute inset-0 z-[100] bg-transparent cursor-pointer" />
      </div>

      {showHandles && (
        <>
            <div 
                onMouseDown={startResizing}
                className="absolute -bottom-4 -right-4 w-12 h-12 bg-brand-teal text-white rounded-2xl flex items-center justify-center cursor-nwse-resize shadow-2xl hover:scale-110 active:scale-95 z-[210] animate-in fade-in zoom-in duration-200"
            >
                <Maximize2 size={24} className="rotate-90" />
            </div>
            <div 
                className="absolute -top-4 -left-4 w-10 h-10 bg-white dark:bg-slate-800 text-brand-teal rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl border border-gray-100 dark:border-slate-700 z-[210] hover:scale-110 transition-transform"
                data-drag-handle
            >
                <GripVertical size={20} />
            </div>
        </>
      )}

      {isResizing && (
        <div 
            ref={hudRef}
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 z-[210] px-4 py-2 bg-black/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl pointer-events-none"
        >
            {Math.round(containerRef.current?.offsetWidth || 0)} × {Math.round(containerRef.current?.offsetHeight || 0)}
        </div>
      )}
    </NodeViewWrapper>
  );
};

// --- LAYOUT EXTENSIONS ---

const LayoutSection = Node.create({
  name: 'layoutSection',
  group: 'block',
  content: 'layoutColumn+',
  
  addAttributes() {
    return {
      columns: { default: 2 },
    };
  },

  parseHTML() {
    return [{ tag: 'div.layout-section' }];
  },

  renderHTML({ node }) {
    return ['div', { class: `layout-section cols-${node.attrs.columns}` }, 0];
  },

  addCommands() {
    return {
      setLayout: (columns: number) => ({ chain }: { chain: any }) => {
        const columnsContent = Array.from({ length: columns }, () => ({
          type: 'layoutColumn',
          content: [{ type: 'paragraph' }],
        }));

        return chain()
          .insertContent({
            type: 'layoutSection',
            attrs: { columns },
            content: columnsContent,
          })
          .focus()
          .run();
      },
    } as any;
  },
});

const LayoutColumn = Node.create({
  name: 'layoutColumn',
  content: 'block+',
  selectable: false,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div.layout-column' }];
  },

  renderHTML() {
    return ['div', { class: 'layout-column' }, 0];
  },
});

// --- CUSTOM TIPTAP EXTENSIONS ---

const CustomIframe = Node.create({
  name: 'iframe',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { 
        default: '100%',
        parseHTML: element => element.style.width || element.getAttribute('width'),
        renderHTML: attributes => ({ style: attributes.width ? `width: ${attributes.width}` : null })
      },
      height: { 
        default: 'auto',
        parseHTML: element => element.style.height || element.getAttribute('height'),
        renderHTML: attributes => ({ style: attributes.height ? `height: ${attributes.height}` : null })
      },
      indent: {
        default: 0,
        renderHTML: attributes => ({
          style: attributes.indent ? `margin-left: ${attributes.indent * 2}rem` : null,
        }),
        parseHTML: element => (element.style.marginLeft ? parseInt(element.style.marginLeft) / 2 : 0),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.iframe-wrapper',
        getAttrs: element => {
            const iframe = (element as HTMLElement).querySelector('iframe');
            return {
                src: iframe?.getAttribute('src'),
                width: (element as HTMLElement).style.width,
                height: (element as HTMLElement).style.height,
            };
        },
      },
      { tag: 'iframe' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { style, ...rest } = HTMLAttributes;
    return ['div', { class: 'iframe-wrapper', style }, ['iframe', { 
        ...rest,
        frameborder: "0",
        allowfullscreen: "true",
        allow: "autoplay; fullscreen; picture-in-picture"
    }]];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <ResizableMedia {...props}>
        <iframe 
            src={props.node.attrs.src} 
            className="w-full h-full pointer-events-none" 
            frameBorder="0" 
        />
      </ResizableMedia>
    ));
  },
});

const ResizableImage = Image.extend({
  name: 'resizableImage',
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { 
        default: 'auto',
        parseHTML: element => element.style.width || element.getAttribute('width'),
        renderHTML: attributes => ({ style: attributes.width ? `width: ${attributes.width}` : null })
      },
      height: { 
        default: 'auto',
        parseHTML: element => element.style.height || element.getAttribute('height'),
        renderHTML: attributes => ({ style: attributes.height ? `height: ${attributes.height}` : null })
      },
      indent: {
        default: 0,
        renderHTML: attributes => ({
          style: attributes.indent ? `margin-left: ${attributes.indent * 2}rem` : null,
        }),
        parseHTML: element => (element.style.marginLeft ? parseInt(element.style.marginLeft) / 2 : 0),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <ResizableMedia {...props}>
        <img 
            src={props.node.attrs.src} 
            alt={props.node.attrs.alt} 
            className="w-full h-full object-cover block" 
        />
      </ResizableMedia>
    ));
  },
});

const ResizableYoutube = Youtube.extend({
  name: 'resizableYoutube',
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { 
        default: '100%',
        parseHTML: element => element.style.width || element.getAttribute('width'),
        renderHTML: attributes => ({ style: attributes.width ? `width: ${attributes.width}` : null })
      },
      height: { 
        default: 'auto',
        parseHTML: element => element.style.height || element.getAttribute('height'),
        renderHTML: attributes => ({ style: attributes.height ? `height: ${attributes.height}` : null })
      },
      indent: {
        default: 0,
        renderHTML: attributes => ({
          style: attributes.indent ? `margin-left: ${attributes.indent * 2}rem` : null,
        }),
        parseHTML: element => (element.style.marginLeft ? parseInt(element.style.marginLeft) / 2 : 0),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div.youtube-wrapper',
        getAttrs: element => {
            const iframe = (element as HTMLElement).querySelector('iframe');
            return {
                src: iframe?.getAttribute('src'),
                width: (element as HTMLElement).style.width,
                height: (element as HTMLElement).style.height,
            };
        },
      },
      { 
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: element => ({ src: element.getAttribute('src') })
      },
      { 
        tag: 'iframe[src*="youtu.be"]',
        getAttrs: element => ({ src: element.getAttribute('src') })
      }
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, style, ...rest } = HTMLAttributes;
    const videoId = getYoutubeId(src);
    const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : src;
    return ['div', { class: 'youtube-wrapper', style }, ['iframe', { 
        ...rest,
        src: embedUrl,
        frameborder: "0",
        allowfullscreen: "true",
        allow: "autoplay; fullscreen; picture-in-picture"
    }]];
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => {
        const videoId = getYoutubeId(props.node.attrs.src);
        const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : props.node.attrs.src;
        return (
            <ResizableMedia {...props}>
                <div className="w-full h-full bg-black">
                    <iframe 
                        key={videoId || "no-vid"}
                        src={embedUrl}
                        className="w-full h-full pointer-events-none" 
                        frameBorder="0"
                    />
                </div>
            </ResizableMedia>
        );
    });
  },
});

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: { chain: any }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: { chain: any }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      indent: {
        default: 0,
        renderHTML: attributes => ({
          style: `margin-left: ${attributes.indent * 2}rem`,
        }),
        parseHTML: element => (element.style.marginLeft ? parseInt(element.style.marginLeft) / 2 : 0),
      },
    };
  },
});

const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      indent: {
        default: 0,
        renderHTML: attributes => ({
          style: `margin-left: ${attributes.indent * 2}rem`,
        }),
        parseHTML: element => (element.style.marginLeft ? parseInt(element.style.marginLeft) / 2 : 0),
      },
    };
  },
});

// --- CONSTANTS ---

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px", "60px", "72px"];
const COLORS = [
  { name: "Mörk", color: "#003a4d" },
  { name: "Teal", color: "#007c91" },
  { name: "Cyan", color: "#00b4d8" },
  { name: "Röd", color: "#ef4444" },
  { name: "Grå", color: "#64748b" },
  { name: "Svart", color: "#000000" },
];

// --- MAIN COMPONENT ---

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onMediaClick: () => void;
  onVideoClick: () => void;
  placeholder?: string;
}

const RichTextEditor = forwardRef<any, RichTextEditorProps>(({ 
  content, 
  onChange, 
  onMediaClick, 
  onVideoClick, 
  placeholder = "Skriv artikeln här..." 
}, ref) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
      }),
      TextStyle,
      Color,
      FontSize,
      CustomParagraph,
      CustomHeading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ["heading", "paragraph", "resizableImage", "resizableYoutube", "iframe"],
      }),
      CharacterCount,
      LayoutSection,
      LayoutColumn,
      CustomIframe,
      ResizableImage.configure({
        allowBase64: true,
      }),
      ResizableYoutube.configure({
        controls: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-brand-teal dark:text-brand-cyan font-bold underline decoration-2 underline-offset-2 hover:text-brand-dark transition-all cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    editor
  }));

  if (!editor) return null;

  const setIndent = (delta: number) => {
    const { selection } = editor.state;
    editor.chain().focus().command(({ tr, dispatch }) => {
      const { from, to } = selection;
      tr.doc.nodesBetween(from, to, (node, pos) => {
        if (["paragraph", "heading", "resizableImage", "resizableYoutube", "iframe"].includes(node.type.name)) {
          const indent = Math.max(0, (node.attrs.indent || 0) + delta);
          if (dispatch) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
          }
          return false;
        }
      });
      return true;
    }).run();
  };

  const currentFontSize = editor.getAttributes("textStyle").fontSize || "16px";
  const currentColor = editor.getAttributes("textStyle").color || "inherit";

  return (
    <div className="w-full border-2 border-gray-100 dark:border-slate-800 rounded-[1.25rem] bg-white dark:bg-slate-900 overflow-hidden focus-within:border-brand-teal/30 transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md rounded-t-[1.1rem]">
        
        {/* Formatting groups */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Rubrik 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}><Heading1 size={18} /></ToolbarButton>
          <ToolbarButton title="Rubrik 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Fetstil" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold size={18} /></ToolbarButton>
          <ToolbarButton title="Kursiv" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <select 
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-teal cursor-pointer appearance-none px-2"
            value={currentFontSize}
            //@ts-ignore
            onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size.replace('px', '')}</option>
            ))}
          </select>
          
          <div className="relative">
            <ToolbarButton title="Textfärg" onClick={() => setShowColorPicker(!showColorPicker)} active={currentColor !== "inherit"}>
              <Palette size={18} style={{ color: currentColor !== "inherit" ? currentColor : undefined }} />
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-[100] flex gap-2">
                {COLORS.map(c => (
                  <button key={c.color} onClick={() => { editor.chain().focus().setColor(c.color).run(); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-125" style={{ backgroundColor: c.color }} title={c.name} />
                ))}
                <button onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-black hover:bg-gray-100 dark:hover:bg-slate-700">&times;</button>
              </div>
            )}
          </div>
          <ToolbarButton title="Rensa formatering" onClick={() => editor.chain().focus().unsetAllMarks().run()}><Eraser size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Vänster" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}><AlignLeft size={18} /></ToolbarButton>
          <ToolbarButton title="Centrera" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}><AlignCenter size={18} /></ToolbarButton>
          <ToolbarButton title="Höger" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}><AlignRight size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Ut" onClick={() => setIndent(-1)}><Outdent size={18} /></ToolbarButton>
          <ToolbarButton title="In" onClick={() => setIndent(1)}><Indent size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton 
            title="2 Kolumner" 
            onClick={() => (editor.commands as any).setLayout(2)} 
            active={editor.isActive('layoutSection', { columns: 2 })}
          >
            <Columns2 size={18} />
          </ToolbarButton>
          <ToolbarButton 
            title="3 Kolumner" 
            onClick={() => (editor.commands as any).setLayout(3)} 
            active={editor.isActive('layoutSection', { columns: 3 })}
          >
            <Columns3 size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Bild" onClick={() => { editor.chain().focus().run(); onMediaClick(); }}><ImageIcon size={18} /></ToolbarButton>
          <ToolbarButton title="Video" onClick={() => { editor.chain().focus().run(); onVideoClick(); }}><PlayCircle size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pl-2 ml-auto">
          <ToolbarButton title="Ångra" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo size={18} /></ToolbarButton>
          <ToolbarButton title="Gör om" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo size={18} /></ToolbarButton>
        </div>
      </div>

      <div className="p-8 prose dark:prose-invert max-w-none min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      <div className="px-8 py-3 bg-gray-50/30 dark:bg-slate-800/30 border-t border-gray-100 flex justify-end items-center">
        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-gray-400">
          {editor.storage.characterCount.characters()} tecken
        </span>
      </div>
    </div>
  );
});

export default RichTextEditor;

// --- SUB-COMPONENTS ---

function ToolbarButton({ onClick, active = false, disabled = false, children, title }: { onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title: string; }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`p-2 rounded-xl transition-all flex items-center justify-center ${active ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-brand-teal"} disabled:opacity-30`}>
      {children}
    </button>
  );
}
