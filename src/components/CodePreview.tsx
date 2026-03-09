import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CodePreviewProps {
  html: string;
  css: string;
  analysis: {
    sections: string[];
    colorPalette: string[];
    fonts: string[];
    summary: string;
  };
  onDownload: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  html,
  css,
  analysis,
  onDownload,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Analysis Summary */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          🔍 Design Analysis
        </h3>
        <p className="text-sm text-muted-foreground">{analysis.summary}</p>

        <div className="flex flex-wrap gap-2">
          {analysis.sections.map((section) => (
            <span
              key={section}
              className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {section}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Colors:</span>
          {analysis.colorPalette.slice(0, 8).map((color) => (
            <div
              key={color}
              className="w-6 h-6 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Code Tabs */}
      <Tabs defaultValue="html" className="w-full">
        <div className="flex items-center justify-between mb-3">
          <TabsList className="bg-muted">
            <TabsTrigger value="html" className="font-mono text-xs">
              index.html
            </TabsTrigger>
            <TabsTrigger value="css" className="font-mono text-xs">
              style.css
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              Preview
            </TabsTrigger>
          </TabsList>
          <Button onClick={onDownload} size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Download ZIP
          </Button>
        </div>

        <TabsContent value="html" className="relative">
          <button
            onClick={() => copyToClipboard(html, "html")}
            className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-muted/80 backdrop-blur-sm hover:bg-muted transition-colors"
          >
            {copied === "html" ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <pre className="rounded-xl border border-border bg-muted p-4 overflow-auto max-h-[500px] text-sm font-mono text-foreground">
            <code>{html}</code>
          </pre>
        </TabsContent>

        <TabsContent value="css" className="relative">
          <button
            onClick={() => copyToClipboard(css, "css")}
            className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-muted/80 backdrop-blur-sm hover:bg-muted transition-colors"
          >
            {copied === "css" ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <pre className="rounded-xl border border-border bg-muted p-4 overflow-auto max-h-[500px] text-sm font-mono text-foreground">
            <code>{css}</code>
          </pre>
        </TabsContent>

        <TabsContent value="preview">
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"><style>${css}</style></head><body>${html.replace(/<!DOCTYPE[\s\S]*?<body[^>]*>/i, "").replace(/<\/body[\s\S]*$/i, "")}</body></html>`}
              className="w-full h-[500px]"
              title="Preview"
              sandbox="allow-scripts"
            />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CodePreview;
