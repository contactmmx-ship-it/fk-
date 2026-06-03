import React, { useState } from "react";
import { KnowledgeDoc } from "../types";
import { Search, BookOpen, Plus, X, BrainCircuit, FileSpreadsheet, Check } from "lucide-react";

interface KnowledgeBrainProps {
  docs: KnowledgeDoc[];
  onAddDoc: (title: string, category: string, summary: string, content: string) => void;
}

export default function KnowledgeBrain({ docs, onAddDoc }: KnowledgeBrainProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  
  // New doc fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SOP");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  // AI Ask state
  const [askQuery, setAskQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [matchedSources, setMatchedSources] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const filteredDocs = docs.filter((d) => {
    return d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
           d.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddDoc(title, category, summary, content);
    setTitle("");
    setSummary("");
    setContent("");
    setShowAdd(false);
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;
    setLoadingAI(true);
    setAiAnswer("");
    setMatchedSources([]);

    try {
      const res = await fetch("/api/knowledge-brain/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: askQuery }),
      });
      const data = await res.json();
      if (data.status === "success" && data.answerText) {
        setAiAnswer(data.answerText);
        setMatchedSources(data.matchedSources || []);
      } else {
        setAiAnswer(data.error || "Could not query brain. Fallback database lookup shows matching guidelines.");
      }
    } catch (err) {
      console.error(err);
      setAiAnswer("Semantic database context timeout. Please confirm server is active.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(201,168,76,0.1)] pb-4">
        <div>
          <h1 className="font-serif-cormorant text-3xl font-semibold text-[#F0EFE8] leading-tight">
            FK RAG Knowledge Brain
          </h1>
          <p className="font-mono text-[11px] tracking-[1.5px] text-[#C9A84C] mt-1">
            Grounded vector search query engine & neural corporate volumes
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C] text-[11px] font-mono uppercase tracking-wider text-[#C9A84C] bg-[rgba(201,168,76,0.06)] hover:bg-[rgba(201,168,76,0.15)] rounded rounded-md cursor-pointer transition-colors"
        >
          <Plus size={14} /> Record Operational SOP
        </button>
      </div>

      {/* Corporate Brain RAG Vector Search Bar */}
      <section className="bg-gradient-to-br from-[#0A1020] to-[#05080F] border border-[rgba(201,168,76,0.22)] rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-[2px] text-[#C9A84C] flex items-center gap-2 pb-1.5 border-b border-[rgba(201,168,76,0.1)]">
          <BrainCircuit size={15} /> Neural Vector Semantics Grounding Engine (RAG)
        </h3>
        <p className="text-[12px] text-[rgba(240,239,232,0.6)] leading-relaxed">
          Inquire custom operational solutions. Stored blueprints and volume items are retrieved via cosine similarity vectors generated through <strong>gemini-embedding-2-preview</strong>, and contextualized using <strong>gemini-3.5-flash</strong>.
        </p>

        <form onSubmit={handleAskAI} className="flex gap-2.5">
          <input
            type="text"
            required
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            placeholder="Search matching procedures via context embeddings..."
            className="flex-1 bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2.5 text-xs text-[#F0EFE8] focus:border-[#C9A84C]"
          />
          <button
            type="submit"
            disabled={loadingAI}
            className="px-5 bg-[#C9A84C] text-[#06090F] font-mono text-xs uppercase rounded hover:bg-[#E8C878] disabled:opacity-50 cursor-pointer"
          >
            {loadingAI ? "Calculating Similarity..." : "Neural Search & RAG"}
          </button>
        </form>

        {aiAnswer && (
          <div className="space-y-3 p-4 bg-[rgba(5,8,15,0.7)] border-l-2 border-l-[#C9A84C] rounded text-xs text-[#F0EFE8] leading-relaxed animate-fade-in">
            <strong className="text-[#C9A84C] font-mono block mb-1">RAG SYNTHESIZED DECISION ANALYSIS:</strong>
            <div dangerouslySetInnerHTML={{ __html: aiAnswer }} className="whitespace-pre-wrap" />

            {/* Grounded Sources indicators */}
            {matchedSources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[rgba(201,168,76,0.08)] bg-[rgba(5,8,15,0.4)] p-3 rounded">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[rgba(240,239,232,0.5)] block mb-2">
                  Retrieved Vector Grounding Sources:
                </span>
                <div className="flex flex-wrap gap-2">
                  {matchedSources.map((src, index) => {
                    const similarityPct = (src.similarity * 100).toFixed(1);
                    return (
                      <div
                        key={src.id || index}
                        className="flex items-center gap-2 bg-[#0A1020] border border-[rgba(201,168,76,0.15)] px-2.5 py-1 rounded text-[11px]"
                      >
                        <span className="font-medium text-[#F0EFE8]">{src.title}</span>
                        <span className="text-[9px] font-mono text-[#C9A84C] tracking-wide uppercase bg-[rgba(201,168,76,0.05)] px-1.5 py-0.2 border border-[rgba(201,168,76,0.1)] rounded">
                          {src.category}
                        </span>
                        <span className="text-[9.5px] font-mono text-green-400 font-bold">
                          {src.similarity > 0 ? `${similarityPct}% Match` : "Word Match"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add SOP forms */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-[rgba(10,16,32,0.95)] border border-[rgba(201,168,76,0.3)] rounded-lg space-y-4 max-w-lg">
          <div className="flex justify-between items-center border-b border-[rgba(201,168,76,0.1)] pb-2">
            <h3 className="font-serif-cormorant text-base text-[#C9A84C] font-semibold">Publish SOP Document</h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-[rgba(240,239,232,0.5)]">✕</button>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Doc Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pune Franchise Model SOP"
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Category Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
                >
                  <option value="Volume 1">Volume 1 (Revenue Architect)</option>
                  <option value="Volume 2">Volume 2 (SOP & Ops)</option>
                  <option value="Rule">Strict Governance Rule</option>
                  <option value="SOP">General Operational SOP</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Brief Abstract</label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High level overview summary"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-mono text-[rgba(240,239,232,0.4)] mb-1">Document Content</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed text contents (This text is fed to LLM semantic indexes)"
                className="w-full bg-[#05080F] border border-[rgba(201,168,76,0.18)] rounded p-2 text-xs text-[#F0EFE8]"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2 bg-[#C9A84C] text-[#06090F] font-mono text-xs uppercase rounded cursor-pointer">
            Deploy Document
          </button>
        </form>
      )}

      {/* Directory Search controls */}
      <div className="flex items-center gap-2 bg-[rgba(8,12,22,0.5)] border border-[rgba(201,168,76,0.18)] p-3 rounded-lg">
        <Search size={14} className="text-[rgba(240,239,232,0.4)] ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter volumes and SOP guidelines..."
          className="bg-transparent border-none focus:outline-none text-xs text-[#F0EFE8] w-full"
        />
      </div>

      {/* Docs Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-[#0A1020] border border-[rgba(201,168,76,0.18)] p-4.5 rounded-lg space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-serif-cormorant text-lg font-bold text-[#F0EFE8] leading-tight">{doc.title}</h3>
                <span className="text-[9px] font-mono text-[#C9A84C] tracking-widest uppercase bg-[rgba(201,168,76,0.06)] px-2 py-0.5 rounded border border-[rgba(201,168,76,0.1)] mt-1.5 inline-block">
                  {doc.category}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.12)] flex items-center justify-center text-[#C9A84C]">
                {doc.category === "Rule" ? <FileSpreadsheet size={13} /> : <BookOpen size={13} />}
              </div>
            </div>

            <p className="text-xs text-[rgba(240,239,232,0.55)] leading-relaxed italic border-t border-[rgba(201,168,76,0.06)] pt-2 font-mono">
              Abstract: {doc.summary}
            </p>

            <div className="bg-[rgba(5,8,15,0.4)] p-3 rounded text-xs text-[rgba(240,239,232,0.8)] leading-relaxed">
              {doc.content}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
