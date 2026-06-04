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
  Trash2, Plus, GripVertical, Code, Minimize2
} from "lucide-react";
import { forwardRef, useImperativeHandle, useState, useCallback, useRef, useEffect, useMemo } from "react";

// --- UTILS ---

const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
};

const formatHtml = (html: string): string => {
  let result = '';
  let indent = 0;
  
  const cleanHtml = html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
    
  const blockElements = [
    'p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'pre', 
    'div', 'iframe', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 
    'section', 'article', 'aside', 'header', 'footer', 'resizableimage', 'resizableyoutube'
  ];
  
  const tokens = cleanHtml.split(/(<\/?[a-zA-Z0-9_-]+[^>]*>)/);
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    
    if (token.startsWith('<') && token.endsWith('>')) {
      const isClosing = token.startsWith('</');
      const isSelfClosing = token.endsWith('/>') || token.startsWith('<img') || token.startsWith('<br') || token.startsWith('<hr');
      
      const tagNameMatch = token.match(/<\/?([a-zA-Z0-9_-]+)/);
      const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
      
      const isBlock = blockElements.includes(tagName);
      
      if (isBlock) {
        if (isClosing) {
          indent = Math.max(0, indent - 1);
          result = result.trimEnd() + '\n' + '  '.repeat(indent) + token + '\n';
        } else if (isSelfClosing) {
          result = result.trimEnd() + '\n' + '  '.repeat(indent) + token + '\n';
        } else {
          result = result.trimEnd() + '\n' + '  '.repeat(indent) + token + '\n';
          indent++;
        }
      } else {
        result += token;
      }
    } else {
      result += token;
    }
  }
  
  return result
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim() !== '')
    .join('\n');
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
      tight: {
        default: false,
        parseHTML: element => element.classList.contains('tight-heading') || element.getAttribute('data-tight') === 'true',
        renderHTML: attributes => {
          if (!attributes.tight) return {};
          return {
            'data-tight': 'true',
            class: 'tight-heading',
          };
        },
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
  maximized?: boolean;
}

const RichTextEditor = forwardRef<any, RichTextEditorProps>(({ 
  content, 
  onChange, 
  onMediaClick, 
  onVideoClick, 
  placeholder = "Skriv artikeln här...",
  maximized = false
}, ref) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState("");
  const [headingValue, setHeadingValue] = useState("p");
  const [fontSizeValue, setFontSizeValue] = useState("16px");
  const [selectionTick, setSelectionTick] = useState(0);

  const toggleHtmlMode = () => {
    if (!editor) return;
    if (isHtmlMode) {
      setIsHtmlMode(false);
    } else {
      setHtmlValue(formatHtml(editor.getHTML()));
      setIsHtmlMode(true);
    }
  };

  const handleHtmlChange = (val: string) => {
    if (!editor) return;
    setHtmlValue(val);
    onChange(val);
    editor.commands.setContent(val, { emitUpdate: false });
  };

  const updateToolbarStates = useCallback((editorInstance: any) => {
    if (!editorInstance) return;
    
    if (editorInstance.isActive("heading", { level: 1 })) setHeadingValue("h1");
    else if (editorInstance.isActive("heading", { level: 2 })) setHeadingValue("h2");
    else if (editorInstance.isActive("heading", { level: 3 })) setHeadingValue("h3");
    else if (editorInstance.isActive("heading", { level: 4 })) setHeadingValue("h4");
    else if (editorInstance.isActive("heading", { level: 5 })) setHeadingValue("h5");
    else if (editorInstance.isActive("heading", { level: 6 })) setHeadingValue("h6");
    else setHeadingValue("p");

    const fs = editorInstance.getAttributes("textStyle").fontSize || "16px";
    setFontSizeValue(fs);

    setSelectionTick(t => t + 1);
  }, []);

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
        levels: [1, 2, 3, 4, 5, 6],
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
      updateToolbarStates(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateToolbarStates(editor);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      updateToolbarStates(editor);
    }
  }, [editor, updateToolbarStates]);

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
  
  const isTightHeading = editor ? (editor.isActive("heading") && editor.getAttributes("heading").tight === true) : false;

  const toggleTightHeading = () => {
    if (!editor) return;
    const currentTight = editor.getAttributes("heading").tight;
    editor.chain().focus().updateAttributes("heading", { tight: !currentTight }).run();
  };

  const handleHeadingChange = (value: string) => {
    if (!editor) return;
    if (value === "p") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace("h", "")) as 1 | 2 | 3 | 4 | 5 | 6;
      editor.chain().focus().toggleHeading({ level }).run();
    }
    setHeadingValue(value);
  };

  const handleFontSizeChange = (value: string) => {
    if (!editor) return;
    //@ts-ignore
    editor.chain().focus().setFontSize(value).run();
    setFontSizeValue(value);
  };

  return (
    <div className={`w-full border-2 border-gray-100 dark:border-slate-800 rounded-[1.25rem] bg-white dark:bg-slate-900 overflow-hidden focus-within:border-brand-teal/30 transition-all ${maximized ? "h-full flex flex-col min-h-0" : ""}`}>
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 backdrop-blur-md rounded-t-[1.1rem]">
        
        {/* Formatting groups */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-slate-700">
          <select
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-teal cursor-pointer appearance-none px-2"
            value={headingValue}
            disabled={isHtmlMode}
            onChange={(e) => handleHeadingChange(e.target.value)}
          >
            <option value="p">Normal text</option>
            <option value="h1">Rubrik 1 (H1)</option>
            <option value="h2">Rubrik 2 (H2)</option>
            <option value="h3">Rubrik 3 (H3)</option>
            <option value="h4">Rubrik 4 (H4)</option>
            <option value="h5">Rubrik 5 (H5)</option>
            <option value="h6">Rubrik 6 (H6)</option>
          </select>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Fetstil" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} disabled={isHtmlMode}><Bold size={18} /></ToolbarButton>
          <ToolbarButton title="Kursiv" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} disabled={isHtmlMode}><Italic size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <select 
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-teal cursor-pointer appearance-none px-2"
            value={fontSizeValue}
            disabled={isHtmlMode}
            onChange={(e) => handleFontSizeChange(e.target.value)}
          >
            {FONT_SIZES.map(size => (
              <option key={size} value={size}>{size.replace('px', '')}</option>
            ))}
          </select>
          
          <div className="relative">
            <ToolbarButton title="Textfärg" onClick={() => setShowColorPicker(!showColorPicker)} active={currentColor !== "inherit"} disabled={isHtmlMode}>
              <Palette size={18} style={{ color: currentColor !== "inherit" ? currentColor : undefined }} />
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-[100] flex gap-2">
                {COLORS.map(c => (
                  <button key={c.color} onClick={() => { editor.chain().focus().setColor(c.color).run(); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-200 transition-transform hover:scale-125" style={{ backgroundColor: c.color }} title={c.name} disabled={isHtmlMode} />
                ))}
                <button onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-black hover:bg-gray-100 dark:hover:bg-slate-700" disabled={isHtmlMode}>&times;</button>
              </div>
            )}
          </div>
          <ToolbarButton title="Rensa formatering" onClick={() => editor.chain().focus().unsetAllMarks().run()} disabled={isHtmlMode}><Eraser size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Vänster" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} disabled={isHtmlMode}><AlignLeft size={18} /></ToolbarButton>
          <ToolbarButton title="Centrera" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} disabled={isHtmlMode}><AlignCenter size={18} /></ToolbarButton>
          <ToolbarButton title="Höger" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} disabled={isHtmlMode}><AlignRight size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Ut" onClick={() => setIndent(-1)} disabled={isHtmlMode}><Outdent size={18} /></ToolbarButton>
          <ToolbarButton title="In" onClick={() => setIndent(1)} disabled={isHtmlMode}><Indent size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton 
            title="2 Kolumner" 
            onClick={() => (editor.commands as any).setLayout(2)} 
            active={editor.isActive('layoutSection', { columns: 2 })}
            disabled={isHtmlMode}
          >
            <Columns2 size={18} />
          </ToolbarButton>
          <ToolbarButton 
            title="3 Kolumner" 
            onClick={() => (editor.commands as any).setLayout(3)} 
            active={editor.isActive('layoutSection', { columns: 3 })}
            disabled={isHtmlMode}
          >
            <Columns3 size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title="Bild" onClick={() => { editor.chain().focus().run(); onMediaClick(); }} disabled={isHtmlMode}><ImageIcon size={18} /></ToolbarButton>
          <ToolbarButton title="Video" onClick={() => { editor.chain().focus().run(); onVideoClick(); }} disabled={isHtmlMode}><PlayCircle size={18} /></ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-gray-200 dark:border-slate-700">
          <ToolbarButton title={isHtmlMode ? "Visa text" : "Visa HTML-kod"} onClick={toggleHtmlMode} active={isHtmlMode}>
            <Code size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pl-2 ml-auto">
          <ToolbarButton title="Ångra" onClick={() => editor.chain().focus().undo().run()} disabled={isHtmlMode || !editor.can().undo()}><Undo size={18} /></ToolbarButton>
          <ToolbarButton title="Gör om" onClick={() => editor.chain().focus().redo().run()} disabled={isHtmlMode || !editor.can().redo()}><Redo size={18} /></ToolbarButton>
        </div>
      </div>

      <div className={`p-8 prose dark:prose-invert max-w-none custom-scrollbar ${maximized ? "flex-1 overflow-y-auto min-h-0" : "min-h-[400px]"} flex flex-col`}>
        {isHtmlMode ? (
          <textarea
            value={htmlValue}
            onChange={(e) => handleHtmlChange(e.target.value)}
            className={`w-full p-6 font-mono text-xs border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 rounded-2xl outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/5 transition-all text-gray-700 dark:text-gray-300 resize-none ${maximized ? "flex-grow h-full min-h-0" : "min-h-[400px]"}`}
            placeholder="Skriv HTML-kod här..."
          />
        ) : (
          <EditorContent editor={editor} className={maximized ? "h-full" : ""} />
        )}
      </div>

      <div className="px-8 py-3 bg-gray-50/30 dark:bg-slate-800/30 border-t border-gray-100 flex justify-end items-center">
        <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-[9px] font-black uppercase tracking-widest text-gray-400">
          {editor.storage.characterCount.characters()} tecken
        </span>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror .tight-heading {
          margin-bottom: 0.25rem !important;
        }
      `}} />
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
