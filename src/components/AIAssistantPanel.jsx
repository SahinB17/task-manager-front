import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api";
import * as docx from "docx";
import { operationalStatusLabels, priorityLabels, taskTypeLabels } from "../constants/taskConstants";

const logDevError = (...args) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

// AI panel shows business status labels via operational_status.
const statusLabels = operationalStatusLabels;

const toolLabels = {
  create_task: "Task yaratma",
  change_task_status: "Status dəyişmə",
  add_task_comment: "Comment əlavə etmə",
  create_user: "İstifadəçi yaratma",
  update_user: "İstifadəçi yeniləmə",
};

const QUICK_PROMPTS = [
  { icon: "chart", label: "Rəhbərlik üçün strukturlaşdırılmış hesabat", prompt: "Rəhbərlik üçün qısa hesabat hazırla" },
  { icon: "folder", label: "Layihələr üzrə risklər", prompt: "Layihələr üzrə riskləri çıxar" },
  { icon: "clock", label: "Gecikən tapşırıqlar", prompt: "Gecikən tapşırıqları təhlil et" },
  { icon: "checklist", label: "İcraçı yükü", prompt: "İcraçı yükünü analiz et" },
  { icon: "pie", label: "Gecikmə səbəbləri", prompt: "Mərhələlər üzrə gecikmə səbəblərini göstər" },
  { icon: "grid", label: "Dashboard göstəriciləri", prompt: "Dashboard göstəricilərini izah et" },
];

function AIIcon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const icons = {
    chart: (
      <svg {...common}>
        <path d="M4 19V5" />
        <path d="M20 19H4" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-3" />
      </svg>
    ),
    folder: (
      <svg {...common}>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
      </svg>
    ),
    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    ),
    checklist: (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <path d="m9 10 1.5 1.5L14 8" />
        <path d="M9 15h6" />
      </svg>
    ),
    pie: (
      <svg {...common}>
        <path d="M12 3v9h9" />
        <path d="M19.1 17.1A8 8 0 1 1 12 4" />
        <path d="M15 3.6A8 8 0 0 1 20.4 9" />
      </svg>
    ),
    grid: (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    ),
    sparkle: (
      <svg {...common}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
      </svg>
    ),
    send: (
      <svg {...common}>
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
    more: (
      <svg {...common}>
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
  };

  return icons[name] || icons.sparkle;
}

const LIMITED_PROJECT_COUNT = 5;

const assistantRuntimeState = {
  activeConversationId: null,
  conversations: [],
  messages: [],
  input: "",
};

/* ---------- Build Word-friendly HTML from markdown ---------- */
function buildWordHtml(text) {
  if (!text) return "";

  const lines = text.split("\n");
  const parts = [];
  let inList = null;
  let inTable = false;

  function inlineHtml(s) {
    if (!s) return "";
    return s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:10pt;">$1</code>');
  }

  function closeList() {
    if (inList === "ul") { parts.push("</ul>"); inList = null; }
    if (inList === "ol") { parts.push("</ol>"); inList = null; }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Tables
    if (line.startsWith("|") && line.endsWith("|")) {
      if (!inTable) {
        closeList();
        parts.push(
          '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:10pt;border:1px solid #cbd5e1;">'
        );
        inTable = true;
      }
      if (/^[\s|:\-]+$/.test(line) && line.includes("-")) continue;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      const isHeader = i === 0 || (lines[i - 1] && /^[\s|:\-]+$/.test(lines[i - 1]) && lines[i - 1].includes("-"));
      // Actually detect header: if next line is separator row
      const nextIsSep = i + 1 < lines.length && /^[\s|:\-]+$/.test(lines[i + 1]) && lines[i + 1].includes("-");
      if (nextIsSep) {
        parts.push("<thead><tr>");
        for (const c of cells) {
          parts.push(
            '<th style="background:#f8fafc;padding:6px 10px;text-align:left;font-weight:700;border:1px solid #cbd5e1;color:#0f172a;">' +
            inlineHtml(c) + "</th>"
          );
        }
        parts.push("</tr></thead><tbody>");
        i++; // skip separator
        continue;
      }
      parts.push("<tr>");
      for (const c of cells) {
        parts.push(
          '<td style="padding:5px 10px;border:1px solid #cbd5e1;vertical-align:top;">' +
          inlineHtml(c) + "</td>"
        );
      }
      parts.push("</tr>");
      continue;
    }
    if (inTable) {
      parts.push("</tbody></table>");
      inTable = false;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      closeList();
      parts.push('<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />');
      continue;
    }

    // Headings — # h1, ## h2, ### h3
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const tagMap = { 1: "h1", 2: "h2", 3: "h3" };
      const tag = tagMap[level] || "h2";
      const styleMap = {
        1: 'style="margin:20px 0 8px;font-size:18pt;font-weight:700;color:#0f172a;"',
        2: 'style="margin:18px 0 6px;font-size:14pt;font-weight:700;color:#0f172a;"',
        3: 'style="margin:14px 0 4px;font-size:12pt;font-weight:700;color:#1e293b;"',
      };
      const tagStyle = styleMap[level] || styleMap[2];
      parts.push(`<${tag} ${tagStyle}>${inlineHtml(headingMatch[2])}</${tag}>`);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inList !== "ul") { closeList(); parts.push('<ul style="margin:4px 0;padding-left:24px;">'); inList = "ul"; }
      parts.push("<li style=\"margin:2px 0;\">" + inlineHtml(ulMatch[1]) + "</li>");
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inList !== "ol") { closeList(); parts.push('<ol style="margin:4px 0;padding-left:24px;">'); inList = "ol"; }
      parts.push("<li style=\"margin:2px 0;\">" + inlineHtml(olMatch[1]) + "</li>");
      continue;
    }

    closeList();

    // Empty line = paragraph break
    if (line === "") {
      parts.push('<p style="margin:0;font-size:0;line-height:8px;">&nbsp;</p>');
      continue;
    }

    // Regular paragraph
    parts.push('<p style="margin:4px 0;line-height:1.55;">' + inlineHtml(line) + "</p>");
  }

  closeList();
  if (inTable) parts.push("</tbody></table>");

  return (
    '<div style="background:#ffffff;color:#0f172a;font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;padding:20px;max-width:800px;">' +
    parts.join("\n") +
    "</div>"
  );
}

/* ---------- "Word üçün kopyala" button ---------- */
function CopyWordButton({ text }) {
  const [state, setState] = useState("idle"); // idle | copying | success | error

  const handleCopy = async () => {
    setState("copying");
    try {
      const html = buildWordHtml(text);
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobText = new Blob([text], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText }),
      ]);
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (_err) {
      // Fallback: plain text only
      try {
        await navigator.clipboard.writeText(text);
        setState("success");
        setTimeout(() => setState("idle"), 3000);
      } catch (_e2) {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      }
    }
  };

  const label =
    state === "success"
      ? "✓ Kopyalandı"
      : state === "error"
        ? "✗ Kopyalanmadı"
        : "Word üçün kopyala";
  const disabled = state === "copying";

  return (
    <button
      type="button"
      className={`ai-copy-word-btn${state === "success" ? " copied" : ""}${state === "error" ? " error" : ""}`}
      onClick={handleCopy}
      disabled={disabled}
      aria-label="Copy report as Word-friendly HTML"
    >
      {label}
    </button>
  );
}

/* ---------- DOCX export ---------- */

function stripEmojis(text) {
  if (!text) return text;
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]|\u{FE0F}|\u{200D}/gu, "")
    .replace(/[\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{2190}-\u{21FF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseInlineToDocxRuns(text) {
  if (!text) return [new docx.TextRun({ text: "" })];
  const cleaned = stripEmojis(text);
  if (!cleaned) return [new docx.TextRun({ text: "" })];
  const parts = [];
  let remaining = cleaned;
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(new docx.TextRun({ text: remaining.slice(lastIndex, match.index) }));
    }
    if (match[1]) {
      parts.push(new docx.TextRun({ text: match[1], bold: true }));
    } else if (match[2]) {
      parts.push(new docx.TextRun({ text: match[2], italics: true }));
    } else if (match[3]) {
      parts.push(new docx.TextRun({ text: match[3], font: "Consolas", size: 20, color: "E11D48" }));
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < remaining.length) {
    parts.push(new docx.TextRun({ text: remaining.slice(lastIndex) }));
  }
  return parts.length ? parts : [new docx.TextRun({ text: cleaned })];
}

function parseTableCellRuns(text) {
  const cleaned = stripEmojis(text);
  if (!cleaned) return [new docx.TextRun({ text: "" })];
  // Same bold/italic/code parsing, but no inline formatting in table cells for simplicity
  return [new docx.TextRun({ text: cleaned })];
}

function getMaxTableColumns(text) {
  const tLines = text.split("\n");
  let maxCols = 0;
  for (const tl of tLines) {
    if (tl.startsWith("|") && tl.endsWith("|") && !(/^[\s|:\-]+$/.test(tl) && tl.includes("-"))) {
      maxCols = Math.max(maxCols, tl.split("|").slice(1, -1).length);
    }
  }
  return maxCols;
}

async function buildDocxBlob(text) {
  const lines = text.split("\n");
  const children = [];
  let inList = null;
  let listItems = [];
  let tableAccum = [];

  function flushList() {
    if (listItems.length > 0) {
      children.push(...listItems);
      listItems = [];
      inList = null;
    }
  }

  function flushTable() {
    if (tableAccum.length === 0) return;
    const hasHeader = tableAccum.length > 1;
    const docxRows = tableAccum.map((row, ri) =>
      row.cells
        ? new docx.TableRow({
            tableHeader: ri === 0 && hasHeader,
            children: row.cells.map((cellText) =>
              new docx.TableCell({
                shading:
                  ri === 0 && hasHeader
                    ? { type: docx.ShadingType.CLEAR, fill: "F2F2F2" }
                    : undefined,
                children: [
                  new docx.Paragraph({
                    spacing: { before: 20, after: 20 },
                    children: [
                      new docx.TextRun({
                        text: stripEmojis(cellText),
                        bold: ri === 0 && hasHeader,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              })
            ),
          })
        : null
    ).filter(Boolean);
    if (docxRows.length > 0) {
      children.push(
        new docx.Table({
          rows: docxRows,
          width: { size: 100, type: docx.WidthType.PERCENTAGE },
          borders: {
            top: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            bottom: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            left: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            right: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            insideVertical: { style: docx.BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
        })
      );
      children.push(new docx.Paragraph({ spacing: { after: 120 } }));
    }
    tableAccum = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Table row – accumulate
    if (line.startsWith("|") && line.endsWith("|")) {
      flushList();
      if (inList !== null) flushList();
      if (/^[\s|:\-]+$/.test(line) && line.includes("-")) continue;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      tableAccum.push({ cells });
      continue;
    }
    // Non-table line — flush any accumulated table
    if (tableAccum.length > 0) flushTable();

    // Separator
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flushList();
      children.push(
        new docx.Paragraph({
          spacing: { before: 80, after: 80 },
          border: {
            top: { style: docx.BorderStyle.SINGLE, size: 6, color: "E2E8F0", space: 1 },
          },
        })
      );
      continue;
    }

    // Heading — # h1, ## h2, ### h3
    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const hlMap = {
        1: docx.HeadingLevel.HEADING_1,
        2: docx.HeadingLevel.HEADING_2,
        3: docx.HeadingLevel.HEADING_3,
      };
      const hl = hlMap[level] || docx.HeadingLevel.HEADING_2;
      children.push(
        new docx.Paragraph({
          heading: hl,
          spacing: { before: 240, after: 80 },
          children: parseInlineToDocxRuns(hMatch[2]),
        })
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inList !== "ul") {
        flushList();
        inList = "ul";
      }
      listItems.push(
        new docx.Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: parseInlineToDocxRuns(ulMatch[1]),
        })
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inList !== "ol") {
        flushList();
        inList = "ol";
      }
      listItems.push(
        new docx.Paragraph({
          numbering: { reference: "ordered-list", level: 0 },
          spacing: { after: 40 },
          children: parseInlineToDocxRuns(olMatch[1]),
        })
      );
      continue;
    }

    flushList();

    // Empty line
    if (line === "") {
      children.push(new docx.Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Regular paragraph
    children.push(
      new docx.Paragraph({
        spacing: { after: 80 },
        children: parseInlineToDocxRuns(line),
      })
    );
  }

  flushList();
  if (tableAccum.length > 0) flushTable();

  const maxCols = getMaxTableColumns(text);
  const isLandscape = maxCols > 4;

  const doc = new docx.Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
          paragraph: { spacing: { after: 80 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: docx.LevelFormat.DECIMAL,
              text: "%1.",
              alignment: docx.AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: isLandscape
              ? { width: 16838, height: 11906 }
              : { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  return await docx.Packer.toBlob(doc);
}

/* ---------- "DOCX yüklə" button ---------- */
function DocxDownloadButton({ text }) {
  const [state, setState] = useState("idle"); // idle | generating | success | error

  const handleDownload = async () => {
    setState("generating");
    try {
      const blob = await buildDocxBlob(text);
      const date = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AI_hesabat_${date}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      logDevError("DOCX export error:", err);
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  const label =
    state === "success"
      ? "✓ Endi"
      : state === "error"
        ? "✗ Uğursuz"
        : "DOCX yüklə";

  return (
    <button
      type="button"
      className={`ai-docx-btn${state === "success" ? " success" : ""}${state === "error" ? " error" : ""}`}
      onClick={handleDownload}
      disabled={state === "generating"}
    >
      {label}
    </button>
  );
}

function isReportText(text) {
  if (!text || text.length < 200) return false;
  const lower = text.toLowerCase();

  // Block clarification / confirmation / task-creation messages.
  // These are UI prompts asking the user for more info — never reports.
  const clarificationPatterns = [
    "dəqiqləşdirmə",
    "hansı layihə",
    "hansı növ",
    "təsdiq",
    "tapşırıq yarat",
    "task yarat",
    "məlumatlar tamamlandı",
    "təsdiq üçün",
    "istifadəçi tapıldı",
    "layihə ilə bağlı",
    "yaradıldı",
    "icraçı tapılmadı",
    "layihə tapılmadı",
    "bir neçə oxşar",
    "daha dəqiq",
    "yenidən soruş",
    "açıqlama istə",
    "təsdiqlə",
    "seçin",
  ];
  for (const pattern of clarificationPatterns) {
    if (lower.includes(pattern)) return false;
  }

  // Has markdown headings = structured report
  if (/^#{1,3}\s/m.test(text)) return true;
  // Long text with report keywords
  if (text.length > 500 && (
    lower.includes("hesabat") || lower.includes("xülasə") ||
    lower.includes("təhlil") || lower.includes("riskl") ||
    lower.includes("tövsiy") || lower.includes("müşahid") ||
    lower.includes("rəhbərlik") || lower.includes("icmal") ||
    lower.includes("monitorinq")
  )) return true;
  return false;
}

/* ---------- Safe markdown renderer ---------- */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let inList = null;
  let inTable = null;
  let listItems = [];
  let tableRows = [];

  function flushList() {
    if (listItems.length > 0) {
      const Tag = inList === "ul" ? "ul" : "ol";
      elements.push(<Tag className="ai-md-list">{listItems}</Tag>);
      listItems = [];
      inList = null;
    }
  }

  function flushTable() {
    if (tableRows.length > 0) {
      elements.push(
        <table className="ai-md-table">
          <tbody>{tableRows}</tbody>
        </table>
      );
      tableRows = [];
      inTable = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    // Table
    if (line.startsWith("|") && line.endsWith("|")) {
      if (inTable === null) inTable = true;
      // Skip separator rows like |---|---|
      if (/^[\s|:\-]+$/.test(line) && line.includes("-")) continue;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      tableRows.push(
        <tr>{cells.map((c, ci) => <td key={ci}>{renderInline(c)}</td>)}</tr>
      );
      continue;
    }
    if (inTable) {
      flushTable();
    }

    // Separator (hr)
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flushList();
      elements.push(<hr className="ai-md-hr" />);
      continue;
    }

    // Heading — # h1, ## h2, ### h3
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const tagMap = { 1: "h2", 2: "h3", 3: "h4" };
      const Tag = tagMap[level] || "h3";
      elements.push(<Tag className="ai-md-heading">{renderInline(headingMatch[2])}</Tag>);
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inList !== "ul") flushList();
      inList = "ul";
      listItems.push(<li>{renderInline(ulMatch[1])}</li>);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inList !== "ol") flushList();
      inList = "ol";
      listItems.push(<li>{renderInline(olMatch[1])}</li>);
      continue;
    }

    flushList();

    // Empty line = paragraph break
    if (line === "") {
      elements.push(<div className="ai-md-spacer" />);
      continue;
    }

    // Regular paragraph
    elements.push(<p className="ai-md-p">{renderInline(line)}</p>);
  }

  flushList();
  flushTable();

  return <div className="ai-md">{elements}</div>;
}

function renderInline(text) {
  if (!text) return "";
  const parts = [];
  let remaining = text;

  // Match bold, italic, inline code
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={parts.length}>{match[2]}</strong>);
    } else if (match[4]) {
      // *italic*
      parts.push(<em key={parts.length}>{match[4]}</em>);
    } else if (match[6]) {
      // `inline code`
      parts.push(<code key={parts.length} className="ai-md-code">{match[6]}</code>);
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length === 0 ? text : parts;
}

/* ---------- Helpers ---------- */
function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("az-AZ", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("az-AZ", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

function normalizeToolResults(responseOrResults) {
  if (Array.isArray(responseOrResults)) return responseOrResults;
  if (Array.isArray(responseOrResults?.tool_results)) return responseOrResults.tool_results;
  if (responseOrResults?.data && typeof responseOrResults.data === "object") {
    return [responseOrResults.data];
  }
  return [];
}

function getResultCount(result) {
  if (typeof result?.total_count === "number") return result.total_count;
  if (Array.isArray(result?.tasks)) return result.tasks.length;
  if (Array.isArray(result?.users)) return result.users.length;
  if (Array.isArray(result?.projects)) return result.projects.length;
  if (Array.isArray(result?.stages)) return result.stages.length;
  if (result?.summary) return 1;
  return 0;
}

function hasRenderableToolResult(result) {
  return Boolean(
    result?.task || result?.user || result?.comment || result?.summary ||
    Array.isArray(result?.tasks) || Array.isArray(result?.users) ||
    Array.isArray(result?.projects) || Array.isArray(result?.stages) ||
    Array.isArray(result?.data?.tasks) || Array.isArray(result?.data?.users)
  );
}

function getRenderableToolResults(toolResults) {
  return normalizeToolResults(toolResults).filter(
    (result) =>
      hasRenderableToolResult(result) &&
      !["read_customers", "create_customer", "update_customer"].includes(result?.tool) &&
      !result?.customer && !result?.customers && !result?.data?.customers
  );
}

function getErrorText(detail, fallback) {
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join("\n");
  }
  return fallback;
}

function getPendingPreviewRows(pendingTool) {
  const toolName = pendingTool?.tool_name;
  const args = pendingTool?.arguments || {};
  const rows = [{ label: "Əməliyyat", value: toolLabels[toolName] || toolName }];
  if (args.title) rows.push({ label: "Task", value: args.title });
  if (args.task_query) rows.push({ label: "Task", value: args.task_query });
  if (args.status) rows.push({ label: "Status", value: statusLabels[args.status] || args.status });
  if (args.priority) rows.push({ label: "Prioritet", value: priorityLabels[args.priority] || args.priority });
  if (args.task_type) rows.push({ label: "Task növü", value: taskTypeLabels[args.task_type] || args.task_type });
  if (args.assignee_query || args.assigned_to) rows.push({ label: "İcraçı", value: args.assignee_query || args.assigned_to });
  if (args.user_query || args.user_id) rows.push({ label: "İstifadəçi", value: args.user_query || args.user_id });
  if (args.full_name) rows.push({ label: "Ad soyad", value: args.full_name });
  if (args.email) rows.push({ label: "Email", value: args.email });
  if (args.deadline) rows.push({ label: "Deadline", value: formatDateTime(args.deadline) });
  if (args.comment) rows.push({ label: "Comment", value: args.comment });
  if (args.description) rows.push({ label: "Təsvir", value: args.description });
  return rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== "");
}

/* ---------- Detect query intent ---------- */
function isExplicitProjectQuery(text) {
  const lower = (text || "").toLowerCase();
  return (
    lower.includes("layihələri göstər") ||
    lower.includes("layihə siyahısı") ||
    lower.includes("bütün layihələr") ||
    lower.includes("projects list") ||
    lower.includes("projects göstər") ||
    lower.includes("layihələri sadala") ||
    lower.includes("layihələri list")
  );
}

/** User wants to *see* items listed (cards expanded) */
function isListIntent(text) {
  const lower = (text || "").toLowerCase();
  return (
    lower.includes("göstər") ||
    lower.includes("siyahı") ||
    lower.includes("list") ||
    lower.includes("hamısını göstər") ||
    lower.includes("bütün")
  );
}

/** User wants an analysis / report / summary (cards collapsed, narrative first) */
function isReportIntent(text) {
  const lower = (text || "").toLowerCase();
  return (
    lower.includes("hesabat") ||
    lower.includes("təhlil") ||
    lower.includes("xülasə") ||
    lower.includes("qısa") ||
    lower.includes("analiz") ||
    lower.includes("riskləri çıxar") ||
    lower.includes("monitorinq") ||
    lower.includes("portfolio icmal") ||
    lower.includes("layihə risk")
  );
}

/** User explicitly asks about dashboard / KPI / ümumi göstəricilər */
function isDashboardIntent(text) {
  const lower = (text || "").toLowerCase();
  return (
    lower.includes("dashboard") ||
    lower.includes("kpi") ||
    lower.includes("ümumi göstərici") ||
    lower.includes("icmal") ||
    lower.includes("göstəriciləri izah")
  );
}

function isReportQuery(text) {
  return isDashboardIntent(text) || isReportIntent(text);
}

/* ---------- Compute tool results summary string ---------- */
function getToolSummaryText(toolResults) {
  const results = getRenderableToolResults(toolResults);
  if (!results.length) return null;
  let total = 0;
  let labels = [];
  for (const r of results) {
    const c = getResultCount(r);
    total += c;
    if (r.tool === "read_tasks" && c > 0) labels.push("tapşırıq");
    else if (r.tool === "read_projects" && c > 0) labels.push("layihə");
    else if (r.tool === "read_project_stages" && c > 0) labels.push("mərhələ");
    else if (r.tool === "read_users" && c > 0) labels.push("istifadəçi");
    else if (r.tool === "get_dashboard_summary" && c > 0) labels.push("dashboard");
    else if (r.tool === "get_project_monitoring_summary" && c > 0) labels.push("monitorinq");
  }
  const uniqueLabel = [...new Set(labels)].join(", ");
  return `İstifadə olunan məlumatlar (${total} nəticə)`;
}

/* ---------- Card components ---------- */
function TaskResultCard({ task }) {
  return (
    <article className="ai-card">
      <div className="ai-card-header">
        <strong>{task.title || "Adsız task"}</strong>
        <span className={`ai-badge status-${task.operational_status || task.status}`}>
          {statusLabels[task.operational_status || task.status] || task.operational_status || task.status}
        </span>
      </div>
      <div className="ai-card-meta">
        {task.assigned_user && <span><i>İcraçı:</i> {task.assigned_user}</span>}
        {task.priority && <span><i>Prioritet:</i> {priorityLabels[task.priority] || task.priority}</span>}
        {task.deadline && <span><i>Deadline:</i> {formatDateTime(task.deadline)}</span>}
        {task.overdue_text && <span className="ai-overdue"><i>Gecikmə:</i> {task.overdue_text}</span>}
      </div>
    </article>
  );
}

function ProjectResultCard({ project }) {
  return (
    <article className="ai-card">
      <div className="ai-card-header">
        <strong>{project.name || "Adsız layihə"}</strong>
        <span className={`ai-badge ${project.is_active ? "status-in_progress" : "status-todo"}`}>
          {project.is_active ? "Aktiv" : "Deaktiv"}
        </span>
      </div>
      <div className="ai-card-meta">
        {project.code && <span><i>Kod:</i> {project.code}</span>}
        {project.owner && <span><i>Sahib:</i> {project.owner}</span>}
        {project.direction_program && <span><i>Direction:</i> {project.direction_program}</span>}
        {project.approach && <span><i>Yanaşma:</i> {project.approach}</span>}
        {project.task_counts && (
          <span className="ai-stat-row">
            <i>Tasklar:</i> {project.task_counts.total_tasks} ümumi, {project.task_counts.active_tasks} aktiv, {project.task_counts.overdue_tasks} gecikən
          </span>
        )}
      </div>
    </article>
  );
}

function ProjectStageResultCard({ stage }) {
  return (
    <article className="ai-card ai-stage-card">
      <div className="ai-card-header">
        <strong>{stage.name || "Adsız mərhələ"}</strong>
        {stage.status && <span className="ai-badge">{stage.status}</span>}
      </div>
      <div className="ai-card-meta">
        {stage.project_name && <span><i>Layihə:</i> {stage.project_name}</span>}
        {stage.planned_start && <span><i>Plan başlanğıc:</i> {formatDate(stage.planned_start)}</span>}
        {stage.planned_end && <span><i>Plan bitmə:</i> {formatDate(stage.planned_end)}</span>}
        {stage.actual_end && <span><i>Fakt bitmə:</i> {formatDate(stage.actual_end)}</span>}
        {stage.completion_percent != null && <span><i>İcra faizi:</i> %{stage.completion_percent}</span>}
        {stage.weight_percent != null && <span><i>Çəki faizi:</i> %{stage.weight_percent}</span>}
        {stage.delay_reason && <span className="ai-overdue"><i>Gecikmə səbəbi:</i> {stage.delay_reason}</span>}
      </div>
    </article>
  );
}

function UserResultCard({ user }) {
  return (
    <article className="ai-card">
      <div className="ai-card-header">
        <strong>{user.full_name || "Adsız istifadəçi"}</strong>
        <span className="ai-badge">{user.is_active ? "Aktiv" : "Deaktiv"}</span>
      </div>
      <div className="ai-card-meta">
        {user.email && <span><i>Email:</i> {user.email}</span>}
        {user.role_id && <span><i>Rol:</i> {user.role_id === 1 ? "Admin" : user.role_id === 2 ? "Menecer" : "İşçi"}</span>}
      </div>
    </article>
  );
}

function DashboardSummary({ summary }) {
  const items = [
    ["Ümumi", summary.total_tasks, ""],
    ["Gözləmədə", summary.todo_tasks, ""],
    ["İcrada", summary.in_progress_tasks, ""],
    ["Tamamlandı", summary.done_tasks, ""],
    ["Gecikən", summary.overdue_tasks, "danger"],
  ];
  const isEmpty = items.every(([, v]) => !v);
  if (isEmpty) return <div className="ai-empty-inline">Məlumat tapılmadı</div>;

  return (
    <div className="ai-kpi-row">
      {items.map(([label, value, cls]) => (
        <div className={`ai-kpi-item ${cls}`} key={label}>
          <span>{label}</span>
          <strong>{value ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}

function MonitoringSummary({ summary }) {
  if (!summary || typeof summary !== "object") return null;
  const items = [
    ["Ümumi layihə", summary.total_projects],
    ["Aktiv layihə", summary.active_projects],
    ["Gecikməsi olan", summary.projects_with_overdue_tasks],
  ];
  const isEmpty = items.every(([, v]) => !v);
  if (isEmpty) return <div className="ai-empty-inline">Məlumat tapılmadı</div>;

  return (
    <div className="ai-section">
      <div className="ai-kpi-row">
        {items.map(([label, value]) => (
          <div className="ai-kpi-item" key={label}>
            <span>{label}</span>
            <strong>{value ?? 0}</strong>
          </div>
        ))}
      </div>
      {Array.isArray(summary.top_projects_by_overdue_tasks) && summary.top_projects_by_overdue_tasks.length > 0 && (
        <div className="ai-monitor-detail">
          <strong>Ən çox gecikən layihələr</strong>
          {summary.top_projects_by_overdue_tasks.map((p, i) => (
            <span key={i}>{p.project_name}: {p.overdue_tasks} gecikən task</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PendingActionPreview({ pendingTool }) {
  const rows = getPendingPreviewRows(pendingTool);
  if (!rows.length) return null;

  return (
    <div className="ai-pending-box">
      <strong>Təsdiq gözləyən əməliyyat</strong>
      <dl>
        {rows.map((row) => (
          <div key={`${row.label}-${row.value}`}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------- Collapsible tool results ---------- */
function CollapsibleResults({ toolResults, userMessage }) {
  const results = getRenderableToolResults(toolResults);
  if (!results.length) return null;

  const [expanded, setExpanded] = useState(false);
  const [projectLimit, setProjectLimit] = useState(LIMITED_PROJECT_COUNT);

  const showDashInline = isDashboardIntent(userMessage);
  const showCardsInline = isListIntent(userMessage);

  // Compact KPI summaries — only when user asks about dashboard
  const summaryResults = results.filter((r) => r.summary);
  const hasSummary = summaryResults.length > 0;
  const renderSummaryInline = showDashInline && hasSummary;

  // Count totals for the toggle label
  let totalItems = 0;
  for (const r of results) totalItems += getResultCount(r);
  const toggleLabel = expanded
    ? "İstifadə olunan məlumatları gizlət ▲"
    : `İstifadə olunan məlumatlar (${totalItems}) ▼`;

  return (
    <div className="ai-collapsible-area">
      {/* Compact KPI summaries — only when user explicitly asks about dashboard */}
      {renderSummaryInline && summaryResults.map((r, i) => (
        r.summary?.total_tasks != null && !r.summary?.total_projects != null
          ? <DashboardSummary key={`dash-${i}`} summary={r.summary} />
          : r.summary?.total_projects != null
            ? <MonitoringSummary key={`mon-${i}`} summary={r.summary} />
            : null
      ))}

      {/* Toggle for detailed data */}
      <button
        type="button"
        className="ai-collapse-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        {toggleLabel}
      </button>

      {expanded && (
        <div className="ai-results">
          {results.map((result, resultIndex) => {
            const tasks = result.tasks || result.data?.tasks || [];
            const users = result.users || result.data?.users || [];
            const projects = result.projects || [];
            const stages = result.stages || [];
            const count = getResultCount(result);

            return (
              <div className="ai-result-block" key={`${result.tool || "tool"}-${resultIndex}`}>
                {count === 0 && !result.summary && !result.task && !result.user && (
                  <div className="ai-empty-inline">Məlumat tapılmadı</div>
                )}

                {/* Tasks */}
                {tasks.length > 0 && tasks.map((task) => (
                  <TaskResultCard key={task.id || task.title} task={task} />
                ))}
                {result.task && <TaskResultCard task={result.task} />}

                {/* Projects — inline only on explicit list/show query */}
                {showCardsInline && projects.length > 0 && (
                  <>
                    {projects.slice(0, projectLimit).map((project) => (
                      <ProjectResultCard key={project.id || project.name} project={project} />
                    ))}
                    {projects.length > projectLimit && (
                      <button
                        type="button"
                        className="ai-show-more"
                        onClick={() => setProjectLimit(projectLimit + 10)}
                      >
                        Daha çox göstər (+{projects.length - projectLimit})
                      </button>
                    )}
                  </>
                )}
                {!showCardsInline && projects.length > 0 && (
                  <div className="ai-md-p ai-muted-note">
                    {projects.length} layihə məlumatı mövcuddur
                  </div>
                )}

                {/* Stages */}
                {stages.length > 0 && stages.map((stage) => (
                  <ProjectStageResultCard key={stage.id || stage.name} stage={stage} />
                ))}

                {/* Users */}
                {users.length > 0 && users.map((user) => (
                  <UserResultCard key={user.id || user.email} user={user} />
                ))}
                {result.user && <UserResultCard user={result.user} />}

                {/* Comment */}
                {result.comment && (
                  <div className="ai-inline-block">
                    <strong>Comment:</strong> {result.comment.comment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Conversation helpers ---------- */
function formatConversationDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("az-AZ", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function mapStoredMessage(message) {
  return {
    role: message.role,
    text: message.content || "",
    toolResults: normalizeToolResults(message),
    pendingTool: message.pending_tool || null,
    pendingToken: message.confirmation_token || null,
  };
}

/* ---------- Main component ---------- */
function AIAssistantPanel({ onActionComplete }) {
  const [messages, setMessages] = useState(() => assistantRuntimeState.messages);
  const [conversations, setConversations] = useState(() => assistantRuntimeState.conversations);
  const [activeConversationId, setActiveConversationId] = useState(
    () => assistantRuntimeState.activeConversationId
  );
  const [input, setInput] = useState(() => assistantRuntimeState.input);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const endRef = useRef(null);

  const loadConversations = async () => {
    const response = await api.get("/ai/conversations");
    setConversations(response.data || []);
  };

  useEffect(() => {
    let isMounted = true;
    const loadInitialConversations = async () => {
      try {
        const response = await api.get("/ai/conversations");
        if (isMounted) setConversations(response.data || []);
      } catch (err) {
        logDevError("AI conversations load error:", err.response?.data || err);
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };
    loadInitialConversations();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => { assistantRuntimeState.messages = messages; }, [messages]);
  useEffect(() => { assistantRuntimeState.conversations = conversations; }, [conversations]);
  useEffect(() => { assistantRuntimeState.activeConversationId = activeConversationId; }, [activeConversationId]);
  useEffect(() => { assistantRuntimeState.input = input; }, [input]);

  useEffect(() => {
    const clearAssistantState = () => {
      assistantRuntimeState.activeConversationId = null;
      assistantRuntimeState.conversations = [];
      assistantRuntimeState.messages = [];
      assistantRuntimeState.input = "";
      setActiveConversationId(null);
      setConversations([]);
      setMessages([]);
      setInput("");
    };
    window.addEventListener("auth:logout", clearAssistantState);
    return () => window.removeEventListener("auth:logout", clearAssistantState);
  }, []);

  const pushAssistantResponse = (response) => {
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        text: response.message || "Cavab alındı.",
        toolResults: normalizeToolResults(response),
        pendingTool: response.pending_tool || null,
        pendingToken: response.requires_confirmation ? response.confirmation_token : null,
        intent: response.intent,
        status: response.status,
      },
    ]);
    if (response.conversation_id) setActiveConversationId(response.conversation_id);
  };

  const refreshAfterAction = async (response) => {
    if (response.status === "completed") await onActionComplete?.(response);
  };

  const submitMessage = async (messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/ai/assistant-v2/message", {
        message: trimmed,
        conversation_id: activeConversationId,
      });
      pushAssistantResponse(response.data);
      await refreshAfterAction(response.data);
      await loadConversations();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessages((current) => [...current, {
        role: "assistant",
        text: getErrorText(detail, "AI Assistant sorğusu tamamlanmadı."),
        status: "error",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (event) => {
    event.preventDefault();
    submitMessage(input);
  };

  const startNewConversation = () => {
    if (loading) return;
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
  };

  const loadConversation = async (conversationId) => {
    if (!conversationId || loading) return;
    setHistoryLoading(true);
    try {
      const response = await api.get(`/ai/conversations/${conversationId}`);
      setActiveConversationId(response.data.conversation?.id || conversationId);
      setMessages((response.data.messages || []).map(mapStoredMessage).filter((m) => m.text));
    } catch (err) {
      logDevError("AI conversation load error:", err.response?.data || err);
      const detail = err.response?.data?.detail;
      setMessages([{ role: "assistant", text: getErrorText(detail, "AI söhbəti yüklənmədi."), status: "error" }]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const runQuickPrompt = (prompt) => {
    if (loading || historyLoading) return;
    submitMessage(prompt);
  };

  const confirmAction = async (token) => {
    if (!token || loading) return;
    setLoading(true);
    try {
      const response = await api.post("/ai/assistant-v2/confirm", {
        confirmation_token: token,
        conversation_id: activeConversationId,
      });
      setMessages((current) =>
        current.map((m) => m.pendingToken === token ? { ...m, pendingToken: null } : m)
      );
      pushAssistantResponse(response.data);
      await refreshAfterAction(response.data);
      await loadConversations();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessages((current) => [...current, {
        role: "assistant",
        text: getErrorText(detail, "Təsdiq əməliyyatı tamamlanmadı."),
        status: "error",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const recentConversations = conversations.slice(0, 10);
  const pendingConversations = conversations
    .filter((c) => c.has_pending).slice(0, 6);

  const hasNoMessages = !messages.length && !loading && !historyLoading;

  return (
    <section className="ai-page">
      <div className="ai-shell">
        <aside className="ai-sidebar">
          <div className="ai-brand">
            <span className="ai-brand-icon">AI</span>
            <div>
              <strong>AI Analitik Köməkçi</strong>
              <small>Layihə və icra monitorinqi</small>
            </div>
            <span className="ai-brand-menu" aria-hidden="true">
              <AIIcon name="more" />
            </span>
          </div>

          <button type="button" className="ai-new-chat" disabled={loading} onClick={startNewConversation}>
            + Yeni söhbət
          </button>

          <div className="ai-sidebar-block">
            <p>Son söhbətlər</p>
            {recentConversations.length > 0 ? (
              recentConversations.map((conv) => (
                <button
                  type="button"
                  className={`ai-history-item${activeConversationId === conv.id ? " active" : ""}`}
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                >
                  <span>{conv.title}</span>
                  <small>{formatConversationDate(conv.updated_at)}</small>
                </button>
              ))
            ) : (
              <span className="ai-sidebar-muted">Hələ söhbət yoxdur</span>
            )}
          </div>

          <div className="ai-sidebar-block">
            <p>Təsdiq gözləyənlər</p>
            {pendingConversations.length > 0 ? (
              pendingConversations.map((conv) => (
                <button
                  type="button"
                  className="ai-history-item pending"
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                >
                  <span>{conv.title}</span>
                  <small>Təsdiq lazımdır</small>
                </button>
              ))
            ) : (
              <span className="ai-sidebar-muted">Gözləyən əməliyyat yoxdur</span>
            )}
          </div>
        </aside>

        <div className="ai-chat">
          <div className="ai-chat-inner">
          <header className="ai-chat-header">
            <div>
              <h2>AI Analitik Köməkçi</h2>
              <p>Layihələr, mərhələlər, tapşırıqlar və icra vəziyyəti üzrə analitik dəstək</p>
            </div>
          </header>

          <div className="ai-msg-list" aria-live="polite">
            {hasNoMessages && (
              <>
                <div className="ai-quick-grid">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.prompt}
                      type="button"
                      className="ai-quick-card"
                      disabled={loading || historyLoading}
                      onClick={() => runQuickPrompt(qp.prompt)}
                    >
                      <span className="ai-quick-icon">
                        <AIIcon name={qp.icon} />
                      </span>
                      <span>{qp.label}</span>
                    </button>
                  ))}
                </div>
                <div className="ai-empty-hint">
                  <span className="ai-empty-icon">
                    <AIIcon name="sparkle" />
                  </span>
                  <strong>Yeni söhbət</strong>
                  <span>Sorğunuzu yazın və ya yuxarıdakı sürətli sorğulardan istifadə edin.</span>
                </div>
              </>
            )}

            {messages.map((message, index) => {
              // Find the preceding user message (for intent detection)
              const prevUserMsg = (() => {
                for (let j = index - 1; j >= 0; j--) {
                  if (messages[j].role === "user") return messages[j].text;
                }
                return "";
              })();
              const userMsg = message.role === "user" ? message.text : prevUserMsg;

              return (
                <div key={`${message.role}-${index}`} className={`ai-msg-row ${message.role}`}>
                  {message.role === "assistant" && <div className="ai-avatar">AI</div>}
                  <div className={`ai-bubble ${message.status === "error" ? "ai-error" : ""} ${message.role === "assistant" ? "ai-bubble-assistant" : "ai-bubble-user"}`}>
                    {message.role === "user" && message.text && (
                      <div className="ai-msg-text">{message.text}</div>
                    )}
                    {message.role === "assistant" && message.text && (
                      renderMarkdown(message.text)
                    )}
                    {message.role === "assistant" && (!message.text || message.text === "Cavab alındı.") && message.toolResults && (
                      <div className="ai-msg-text ai-fallback-msg">
                        Məlumatlar tapıldı, xülasə hazırlamaq üçün cavab yenilənməlidir.
                      </div>
                    )}
                    {message.role === "assistant" && isReportText(message.text) && (
                      <div className="ai-export-row">
                        <CopyWordButton text={message.text} />
                        <DocxDownloadButton text={message.text} />
                      </div>
                    )}
                    {message.pendingTool && <PendingActionPreview pendingTool={message.pendingTool} />}
                    {message.role === "assistant" && message.toolResults && (
                      <CollapsibleResults
                        toolResults={message.toolResults}
                        userMessage={userMsg}
                      />
                    )}
                    {message.pendingToken && (
                      <button type="button" className="ai-confirm-btn" disabled={loading} onClick={() => confirmAction(message.pendingToken)}>
                        Təsdiqlə
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {(loading || historyLoading) && (
              <div className="ai-msg-row assistant">
                <div className="ai-avatar">AI</div>
                <div className="ai-bubble ai-bubble-assistant">
                  <div className="ai-msg-text">{historyLoading ? "Tarixçə yüklənir..." : "Düşünür..."}</div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="ai-input-bar" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              placeholder="Sorğunuzu yazın..."
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || historyLoading}
            />
            <button type="submit" disabled={loading || historyLoading || !input.trim()}>
              Göndər
              <AIIcon name="send" />
            </button>
          </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AIAssistantPanel;
