import { useState, useEffect, useCallback, useMemo } from "react";

// ─── CSV LOADER ───────────────────────────────────────────────────────────────
// Parses the mock_companies.csv file. In a real app, fetch('/data/mock_companies.csv')
// Tags and signals are pipe-separated within the CSV cell.
const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    // Handle quoted fields (e.g., "San Francisco, CA")
    const cols = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur); cur = ""; }
      else { cur += ch; }
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || "").trim(); });
    // Transform pipe-separated fields
    obj.tags = obj.tags ? obj.tags.split("|") : [];
    obj.signals = obj.signals ? obj.signals.split("|") : [];
    obj.score = parseInt(obj.score) || 0;
    obj.founded = parseInt(obj.founded) || 0;
    return obj;
  });
};

// Inline CSV string — swap this for fetch('/data/mock_companies.csv') in production
const CSV_DATA = `id,name,domain,stage,sector,country,hq,founded,employees,funding,score,tags,description,signals,lastActivity
1,Veridian AI,veridian.ai,Seed,AI/ML,USA,"San Francisco, CA",2023,11-50,$4.2M,92,AI|B2B|SaaS,Autonomous AI agents for enterprise workflow automation.,New blog post|Hiring ML Engineers|Launched v2.0,2 days ago
2,Loopstack,loopstack.io,Pre-Seed,DevTools,USA,"New York, NY",2024,1-10,$800K,87,DevTools|Open Source|API,CI/CD pipeline intelligence with AI-driven insights for engineering teams.,GitHub stars +200%|YC S24 batch|Founder ex-Stripe,5 days ago
3,Nutra Sense,nutrasense.co,Series A,HealthTech,UK,"London, UK",2021,51-200,$12M,78,Health|Biotech|Consumer,Personalised nutrition platform powered by continuous glucose monitoring.,NHS partnership announced|Series A closed|1M users milestone,1 week ago
4,Cartographer,cartographer.tech,Seed,Climate,Germany,"Berlin, DE",2022,11-50,$3.1M,83,Climate|GeoSpatial|AI,AI-powered land-use mapping and carbon credit verification.,EU grant awarded|Hiring remote|Nature feature,3 days ago
5,Prism Legal,prismlegal.com,Pre-Seed,LegalTech,USA,"Austin, TX",2023,1-10,Bootstrapped,71,Legal|AI|SaaS,Contract intelligence for mid-market law firms using specialized LLMs.,Beta launched|10 paying customers|Ex-BigLaw founders,1 week ago
6,ThermalCore,thermalcore.energy,Seed,CleanEnergy,Canada,"Toronto, CA",2022,11-50,$5.5M,89,Energy|Hardware|Climate,Next-gen thermal energy storage for industrial decarbonization.,Patents filed|Pilot with steel plant|DOE grant $2M,4 days ago
7,Fieldwork,fieldwork.app,Series A,PropTech,USA,"Chicago, IL",2020,51-200,$18M,74,PropTech|SaaS|Marketplace,Field service management platform for commercial real estate operators.,Series A $18M|Expanding to LATAM|SOC2 certified,2 weeks ago
8,Synthwave Bio,synthwave.bio,Pre-Seed,Biotech,USA,"Boston, MA",2024,1-10,$1.2M,85,Biotech|Synthetic Biology|Drug Discovery,Programmable biosensors for rapid infectious disease diagnostics.,NIH SBIR awarded|MIT spinout|First prototype ready,6 days ago
9,Okapi,okapi.cx,Seed,CX/Support,India,"Bangalore, IN",2023,11-50,$2.8M,80,AI|Customer Support|SaaS,Multilingual AI support agents for Southeast Asian e-commerce.,Shopee partnership|Raised $2.8M|Hiring in SG,1 week ago
10,Gravitas Finance,gravitasfinance.com,Seed,FinTech,USA,"Miami, FL",2022,11-50,$6M,76,FinTech|Credit|B2B,Revenue-based financing platform for bootstrapped SaaS companies.,$6M seed round|300+ customers|Featured in Forbes,3 days ago
11,Polaris Safety,polarissafety.io,Pre-Seed,Safety/AI,USA,"Denver, CO",2024,1-10,$500K,68,Safety|AI|Enterprise,AI-driven workplace safety monitoring for construction sites using computer vision.,First enterprise pilot|Stealth mode lifting,2 weeks ago
12,DataMesh Labs,datameshlabs.com,Series B,Data Infra,USA,"Seattle, WA",2019,201-500,$45M,70,Data|Infrastructure|Open Source,Open-source data mesh orchestration for large-scale enterprises.,AWS partnership|1000+ GitHub stars this month|Hiring VP Sales,1 week ago`;

const MOCK_COMPANIES = parseCSV(CSV_DATA);

// In production, replace the above two lines with:
// const [MOCK_COMPANIES, setMockCompanies] = useState([]);
// useEffect(() => { fetch('/data/mock_companies.csv').then(r => r.text()).then(t => setMockCompanies(parseCSV(t))); }, []);

const STAGES = ["All Stages", ...new Set(MOCK_COMPANIES.map(c => c.stage))];
const SECTORS = ["All Sectors", ...new Set(MOCK_COMPANIES.map(c => c.sector))];
const COUNTRIES = ["All Countries", ...new Set(MOCK_COMPANIES.map(c => c.country))];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 85) return "#00ff9d";
  if (score >= 70) return "#ffd166";
  return "#ff6b6b";
};

const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const mockEnrich = async (company) => {
  await new Promise(r => setTimeout(r, 2200));
  return {
    summary: `${company.name} is an early-stage ${company.sector} company building ${company.description.toLowerCase()} They are headquartered in ${company.hq} and show strong product-market fit signals.`,
    whatTheyDo: [
      `Core product: ${company.description}`,
      `Primary market: ${company.sector} vertical, targeting ${company.tags.join(", ")} use cases`,
      `Business model: B2B SaaS with annual contract value focus`,
      `Go-to-market: Direct sales + product-led growth`,
      `Funding stage: ${company.stage} — ${company.funding} raised`,
      `Team size: ${company.employees} employees, growing`,
    ],
    keywords: [...company.tags, "venture-backed", "early-stage", "founder-led", "product-market-fit", "B2B"].slice(0, 10),
    signals: [
      company.signals[0] ? { label: company.signals[0], type: "positive" } : null,
      { label: `Careers page active — hiring ${["engineers", "sales", "product"][Math.floor(Math.random() * 3)]}`, type: "positive" },
      { label: `Last blog post within 30 days`, type: "neutral" },
      { label: `No changelog detected — product maturity signal`, type: "neutral" },
    ].filter(Boolean),
    sources: [
      { url: `https://${company.domain}`, scraped: new Date().toISOString() },
      { url: `https://${company.domain}/about`, scraped: new Date().toISOString() },
      { url: `https://${company.domain}/careers`, scraped: new Date().toISOString() },
    ],
  };
};

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
const ScoreBadge = ({ score }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    background: `${getScoreColor(score)}18`, border: `1px solid ${getScoreColor(score)}40`,
    color: getScoreColor(score), borderRadius: 6, padding: "2px 8px",
    fontSize: 12, fontWeight: 700, fontFamily: "monospace"
  }}>{score}</span>
);

const Tag = ({ label }) => (
  <span style={{
    background: "#ffffff08", border: "1px solid #ffffff15", color: "#999",
    borderRadius: 4, padding: "2px 7px", fontSize: 11, letterSpacing: 0.3
  }}>{label}</span>
);

const StageChip = ({ stage }) => {
  const colors = { "Pre-Seed": "#a78bfa", "Seed": "#60a5fa", "Series A": "#34d399", "Series B": "#fbbf24" };
  const c = colors[stage] || "#888";
  return (
    <span style={{
      color: c, background: `${c}18`, border: `1px solid ${c}30`,
      borderRadius: 4, padding: "1px 8px", fontSize: 11, fontWeight: 600, letterSpacing: 0.5
    }}>{stage}</span>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const Sidebar = ({ active, setActive, lists }) => {
  const items = [
    { id: "companies", label: "Companies", icon: "◉" },
    { id: "lists", label: "Lists", icon: "⊞", badge: lists.length },
    { id: "saved", label: "Saved Searches", icon: "⌕" },
  ];
  return (
    <aside style={{
      width: 220, minHeight: "100vh", background: "#0d0d0f",
      borderRight: "1px solid #1e1e24", display: "flex", flexDirection: "column", flexShrink: 0
    }}>
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1e1e24" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#fff"
          }}>V</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", letterSpacing: 0.3 }}>VentureScope</div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 0.5 }}>INTELLIGENCE</div>
          </div>
        </div>
      </div>
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        {items.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: active === item.id ? "#6366f120" : "transparent",
            color: active === item.id ? "#a78bfa" : "#666",
            marginBottom: 2, textAlign: "left", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", fontWeight: active === item.id ? 600 : 400,
            transition: "all 0.15s", letterSpacing: 0.2
          }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ background: "#6366f1", color: "#fff", borderRadius: 99, padding: "0px 6px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e24" }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 0.5, marginBottom: 4 }}>DATA SOURCE</div>
        <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>mock_companies.csv</div>
        <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>{MOCK_COMPANIES.length} records loaded</div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 0.5 }}>THESIS</div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 4, lineHeight: 1.5 }}>AI-first B2B · Seed / Pre-Seed · US + EU</div>
      </div>
    </aside>
  );
};

// ─── COMPANIES PAGE ───────────────────────────────────────────────────────────
const CompaniesPage = ({ onSelect, lists, addToList }) => {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All Stages");
  const [sector, setSector] = useState("All Sectors");
  const [country, setCountry] = useState("All Countries");
  const [sort, setSort] = useState({ key: "score", dir: -1 });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    return MOCK_COMPANIES.filter(c => {
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.sector.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
      if (stage !== "All Stages" && c.stage !== stage) return false;
      if (sector !== "All Sectors" && c.sector !== sector) return false;
      if (country !== "All Countries" && c.country !== country) return false;
      return true;
    }).sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
  }, [search, stage, sector, country, sort]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const toggleSort = (key) => setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 });
  const SortArrow = ({ k }) => <span style={{ opacity: 0.4 }}>{sort.key === k ? (sort.dir === 1 ? " ↑" : " ↓") : " ·"}</span>;

  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleBulkList = () => {
    if (!lists.length) return alert("Create a list first on the Lists page.");
    selected.forEach(id => addToList(lists[0].name, id));
    alert(`Added ${selected.size} companies to "${lists[0].name}"`);
    setSelected(new Set());
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'DM Sans', sans-serif", minWidth: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f5", margin: 0, letterSpacing: -0.5 }}>Companies</h1>
        <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>{filtered.length} companies match your thesis · loaded from CSV</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search companies, sectors, keywords…"
          style={{ flex: 1, minWidth: 160, background: "#16161a", border: "1px solid #2a2a33", borderRadius: 8, padding: "8px 12px", color: "#e5e5e5", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        {[["stage", STAGES, stage, v => { setStage(v); setPage(0); }],
          ["sector", SECTORS, sector, v => { setSector(v); setPage(0); }],
          ["country", COUNTRIES, country, v => { setCountry(v); setPage(0); }]
        ].map(([key, opts, val, setter]) => (
          <select key={key} value={val} onChange={e => setter(e.target.value)} style={{
            background: "#16161a", border: "1px solid #2a2a33", borderRadius: 8,
            padding: "8px 10px", color: val.startsWith("All") ? "#555" : "#e5e5e5",
            fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "inherit", maxWidth: 130
          }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "#6366f115", border: "1px solid #6366f130", borderRadius: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "#a78bfa" }}>{selected.size} selected</span>
          <button onClick={handleBulkList} style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Add to List</button>
          <button onClick={() => setSelected(new Set())} style={{ background: "transparent", border: "1px solid #333", color: "#888", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Clear</button>
        </div>
      )}

      <div style={{ background: "#111114", border: "1px solid #1e1e24", borderRadius: 10, overflow: "auto", maxWidth: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e1e24" }}>
              <th style={{ width: 36, padding: "12px 14px" }}>
                <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(visible.map(c => c.id)) : new Set())} />
              </th>
              {[["name", "Company"], ["stage", "Stage"], ["sector", "Sector"], ["employees", "Size"], ["score", "Score"], ["lastActivity", "Activity"]].map(([k, label]) => (
                <th key={k} onClick={() => toggleSort(k)} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#555", letterSpacing: 0.5, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                  {label}<SortArrow k={k} />
                </th>
              ))}
              <th style={{ padding: "12px 14px", fontSize: 11, color: "#555" }}>TAGS</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((company, i) => (
              <tr key={company.id}
                style={{ borderBottom: i < visible.length - 1 ? "1px solid #18181d" : "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "#ffffff04"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "13px 14px" }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(company.id)} onChange={() => toggleSelect(company.id)} />
                </td>
                <td style={{ padding: "13px 14px" }} onClick={() => onSelect(company)}>
                  <div style={{ fontWeight: 600, color: "#e5e5e5", fontSize: 13 }}>{company.name}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{company.domain}</div>
                </td>
                <td style={{ padding: "13px 14px" }} onClick={() => onSelect(company)}><StageChip stage={company.stage} /></td>
                <td style={{ padding: "13px 14px", fontSize: 12, color: "#888" }} onClick={() => onSelect(company)}>{company.sector}</td>
                <td style={{ padding: "13px 14px", fontSize: 12, color: "#777" }} onClick={() => onSelect(company)}>{company.employees}</td>
                <td style={{ padding: "13px 14px" }} onClick={() => onSelect(company)}><ScoreBadge score={company.score} /></td>
                <td style={{ padding: "13px 14px", fontSize: 11, color: "#555" }} onClick={() => onSelect(company)}>{company.lastActivity}</td>
                <td style={{ padding: "13px 14px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {company.tags.slice(0, 2).map(t => <Tag key={t} label={t} />)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {/* Prev arrow */}
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
            width: 32, height: 32, borderRadius: 6, border: "1px solid #2a2a33",
            background: "transparent", color: page === 0 ? "#333" : "#888",
            cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 15, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>‹</button>

          {/* Page numbers */}
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{
              width: 32, height: 32, borderRadius: 6, border: "1px solid",
              borderColor: i === page ? "#6366f1" : "#2a2a33",
              background: i === page ? "#6366f120" : "transparent",
              color: i === page ? "#a78bfa" : "#555",
              fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: i === page ? 700 : 400
            }}>{i + 1}</button>
          ))}

          {/* Next arrow */}
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={{
            width: 32, height: 32, borderRadius: 6, border: "1px solid #2a2a33",
            background: "transparent", color: page === pages - 1 ? "#333" : "#888",
            cursor: page === pages - 1 ? "not-allowed" : "pointer", fontSize: 15, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>›</button>
        </div>
      )}
    </div>
  );
};

// ─── COMPANY PROFILE ─────────────────────────────────────────────────────────
const CompanyProfile = ({ company, onBack, lists, addToList }) => {
  const [note, setNote] = useState(() => ls.get(`note_${company.id}`, ""));
  const [enriched, setEnriched] = useState(() => ls.get(`enrich_${company.id}`, null));
  const [enriching, setEnriching] = useState(false);
  const [enrichErr, setEnrichErr] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showListMenu, setShowListMenu] = useState(false);

  const inLists = lists.filter(l => l.companies.includes(company.id));

  const handleEnrich = async () => {
    setEnriching(true); setEnrichErr(null);
    try {
      const data = await mockEnrich(company);
      setEnriched(data); ls.set(`enrich_${company.id}`, data);
    } catch { setEnrichErr("Enrichment failed. Try again."); }
    finally { setEnriching(false); }
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'DM Sans', sans-serif", maxWidth: "100%", minWidth: 0 }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 24, fontFamily: "inherit", padding: 0 }}>
        ← Back to Companies
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
            {company.name[0]}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f5f5f5", letterSpacing: -0.5 }}>{company.name}</h2>
            <div style={{ color: "#555", fontSize: 13, marginTop: 3 }}>
              <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", textDecoration: "none" }}>{company.domain}</a>
              {" · "}{company.hq}{" · "}Founded {company.founded}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StageChip stage={company.stage} />
              {company.tags.map(t => <Tag key={t} label={t} />)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 4, letterSpacing: 0.5 }}>THESIS SCORE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: getScoreColor(company.score), fontFamily: "monospace" }}>{company.score}</div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowListMenu(!showListMenu)} style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              Save to List ▾
            </button>
            {showListMenu && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 100, background: "#18181d", border: "1px solid #2a2a33", borderRadius: 8, padding: 8, minWidth: 160 }}>
                {!lists.length && <div style={{ fontSize: 12, color: "#555", padding: "6px 10px" }}>No lists yet</div>}
                {lists.map(l => (
                  <button key={l.name} onClick={() => { addToList(l.name, company.id); setShowListMenu(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", background: l.companies.includes(company.id) ? "#6366f115" : "transparent", border: "none", color: l.companies.includes(company.id) ? "#a78bfa" : "#ccc", padding: "7px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                    {l.companies.includes(company.id) ? "✓ " : ""}{l.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[["Funding", company.funding], ["Employees", company.employees], ["Sector", company.sector], ["Country", company.country]].map(([k, v]) => (
          <div key={k} style={{ background: "#111114", border: "1px solid #1e1e24", borderRadius: 8, padding: "12px 16px", flex: "1 1 120px", minWidth: 100 }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 0.5, marginBottom: 4 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 14, color: "#ccc", fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #1e1e24" }}>
        {["overview", "signals", "enrich", "notes"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent", color: activeTab === tab ? "#a78bfa" : "#555", padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: activeTab === tab ? 600 : 400, letterSpacing: 0.3, marginBottom: -1, transition: "all 0.15s" }}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
          <div style={{ fontSize: 14, color: "#bbb", lineHeight: 1.7, marginBottom: 20 }}>{company.description}</div>
          {inLists.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 8, letterSpacing: 0.5 }}>IN LISTS</div>
              <div style={{ display: "flex", gap: 6 }}>
                {inLists.map(l => <span key={l.name} style={{ background: "#6366f115", border: "1px solid #6366f130", color: "#a78bfa", borderRadius: 6, padding: "3px 10px", fontSize: 12 }}>{l.name}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "signals" && (
        <div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 12, letterSpacing: 0.5 }}>RECENT SIGNALS</div>
          {company.signals.map((sig, i) => (
            <div key={i} style={{ background: "#111114", border: "1px solid #1e1e24", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: "#ccc" }}>{sig}</div>
              <div style={{ marginLeft: "auto", fontSize: 11, color: "#444" }}>{["2d ago", "5d ago", "1w ago"][i] || "recently"}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "enrich" && (
        <div>
          {!enriched && !enriching && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
              <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Enrich this profile with live data from {company.domain}</div>
              <button onClick={handleEnrich} style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none", color: "#fff", borderRadius: 8, padding: "11px 24px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Enrich Now</button>
            </div>
          )}
          {enriching && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 13, color: "#6366f1" }}>Fetching data from {company.domain}…</div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 8 }}>Scraping homepage, about, careers pages</div>
            </div>
          )}
          {enrichErr && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{enrichErr}</div>}
          {enriched && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 0.5 }}>ENRICHED DATA</div>
                <button onClick={() => { setEnriched(null); ls.set(`enrich_${company.id}`, null); }} style={{ background: "transparent", border: "1px solid #2a2a33", color: "#555", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Refresh</button>
              </div>
              {[
                ["SUMMARY", <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>{enriched.summary}</div>],
                ["WHAT THEY DO", enriched.whatTheyDo.map((b, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#bbb" }}><span style={{ color: "#6366f1" }}>·</span>{b}</div>)],
                ["KEYWORDS", <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{enriched.keywords.map(k => <Tag key={k} label={k} />)}</div>],
                ["DERIVED SIGNALS", enriched.signals.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}><span style={{ fontSize: 10, color: s.type === "positive" ? "#00ff9d" : "#ffd166" }}>{s.type === "positive" ? "●" : "○"}</span><span style={{ fontSize: 13, color: "#bbb" }}>{s.label}</span></div>)],
                ["SOURCES", enriched.sources.map((s, i) => <div key={i} style={{ fontSize: 12, marginBottom: 4, display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6366f1" }}>{s.url}</span><span style={{ color: "#444" }}>{new Date(s.scraped).toLocaleTimeString()}</span></div>)],
              ].map(([label, content]) => (
                <div key={label} style={{ background: "#111114", border: "1px solid #1e1e24", borderRadius: 8, padding: "16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#6366f1", letterSpacing: 0.5, marginBottom: 10 }}>{label}</div>
                  {content}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add notes about this company…"
            style={{ width: "100%", minHeight: 160, background: "#111114", border: "1px solid #2a2a33", borderRadius: 8, padding: 14, color: "#ccc", fontSize: 13, lineHeight: 1.7, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          <button onClick={() => ls.set(`note_${company.id}`, note)} style={{ marginTop: 10, background: "#6366f1", border: "none", color: "#fff", borderRadius: 7, padding: "9px 18px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Save Note</button>
        </div>
      )}
    </div>
  );
};

// ─── LISTS PAGE ───────────────────────────────────────────────────────────────
const ListsPage = ({ lists, setLists }) => {
  const [newName, setNewName] = useState("");
  const [active, setActive] = useState(null);

  const createList = () => {
    if (!newName.trim()) return;
    setLists(l => [...l, { name: newName.trim(), companies: [], created: new Date().toISOString() }]);
    setNewName("");
  };

  const activeList = lists.find(l => l.name === active);

  const exportCSV = (list) => {
    const data = list.companies.map(id => MOCK_COMPANIES.find(c => c.id === id)).filter(Boolean);
    const csv = ["name,domain,stage,sector,score,funding,employees,hq"].concat(
      data.map(c => `${c.name},${c.domain},${c.stage},${c.sector},${c.score},${c.funding},${c.employees},"${c.hq}"`)
    ).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${list.name}.csv`; a.click();
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'DM Sans', sans-serif", minWidth: 0 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f5", margin: 0, letterSpacing: -0.5, marginBottom: 24 }}>Lists</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createList()}
          placeholder="New list name…"
          style={{ flex: 1, background: "#16161a", border: "1px solid #2a2a33", borderRadius: 8, padding: "9px 14px", color: "#e5e5e5", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
        <button onClick={createList} style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Create</button>
      </div>
      {!lists.length && <div style={{ textAlign: "center", padding: "48px 0", color: "#444", fontSize: 14 }}>No lists yet.</div>}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ width: 220, flexShrink: 0 }}>
          {lists.map(l => (
            <div key={l.name} onClick={() => setActive(l.name)} style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: active === l.name ? "#6366f120" : "#111114", border: `1px solid ${active === l.name ? "#6366f140" : "#1e1e24"}` }}>
              <div style={{ fontSize: 13, color: active === l.name ? "#a78bfa" : "#ccc", fontWeight: 600 }}>{l.name}</div>
              <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{l.companies.length} companies</div>
            </div>
          ))}
        </div>
        {activeList && (
          <div style={{ flex: 1, background: "#111114", border: "1px solid #1e1e24", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f5f5f5" }}>{activeList.name}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => exportCSV(activeList)} style={{ background: "#16161a", border: "1px solid #2a2a33", color: "#888", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Export CSV</button>
                <button onClick={() => { setLists(l => l.filter(x => x.name !== activeList.name)); setActive(null); }} style={{ background: "#ff6b6b15", border: "1px solid #ff6b6b30", color: "#ff6b6b", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
              </div>
            </div>
            {!activeList.companies.length ? (
              <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No companies yet.</div>
            ) : activeList.companies.map(id => {
              const c = MOCK_COMPANIES.find(x => x.id === id);
              if (!c) return null;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #18181d" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#ccc", fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{c.stage} · {c.sector}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <ScoreBadge score={c.score} />
                    <button onClick={() => setLists(l => l.map(x => x.name === activeList.name ? { ...x, companies: x.companies.filter(cid => cid !== id) } : x))}
                      style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SAVED SEARCHES PAGE ──────────────────────────────────────────────────────
const SavedPage = ({ onGoToCompanies }) => {
  const [saves, setSaves] = useState(() => ls.get("saved_searches", []));
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

  const save = () => {
    if (!name.trim() || !query.trim()) return;
    const s = [...saves, { name: name.trim(), query: query.trim(), saved: new Date().toISOString() }];
    setSaves(s); ls.set("saved_searches", s);
    setName(""); setQuery("");
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'DM Sans', sans-serif", minWidth: 0 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f5", margin: 0, letterSpacing: -0.5, marginBottom: 24 }}>Saved Searches</h1>
      <div style={{ background: "#111114", border: "1px solid #1e1e24", borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 12, letterSpacing: 0.5 }}>SAVE A SEARCH</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name…" style={{ flex: "0 0 180px", background: "#16161a", border: "1px solid #2a2a33", borderRadius: 8, padding: "9px 12px", color: "#e5e5e5", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Query / filters…" style={{ flex: 1, background: "#16161a", border: "1px solid #2a2a33", borderRadius: 8, padding: "9px 12px", color: "#e5e5e5", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <button onClick={save} style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Save</button>
        </div>
      </div>
      {!saves.length && <div style={{ textAlign: "center", padding: "48px 0", color: "#444", fontSize: 14 }}>No saved searches yet.</div>}
      {saves.map((s, i) => (
        <div key={i} style={{ background: "#111114", border: "1px solid #1e1e24", borderRadius: 8, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, color: "#e5e5e5", fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>{s.query}</div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>{new Date(s.saved).toLocaleDateString()}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onGoToCompanies} style={{ background: "#6366f115", border: "1px solid #6366f130", color: "#a78bfa", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Run ↗</button>
            <button onClick={() => { const s2 = saves.filter((_, j) => j !== i); setSaves(s2); ls.set("saved_searches", s2); }} style={{ background: "transparent", border: "1px solid #2a2a33", color: "#555", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("companies");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [lists, setLists] = useState(() => ls.get("vc_lists", []));

  useEffect(() => ls.set("vc_lists", lists), [lists]);

  const addToList = useCallback((listName, companyId) => {
    setLists(prev => prev.map(l => l.name === listName
      ? { ...l, companies: l.companies.includes(companyId) ? l.companies : [...l.companies, companyId] }
      : l));
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", maxWidth: "100vw", overflow: "hidden", background: "#0a0a0d", color: "#f5f5f5", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #2a2a33; border-radius: 3px; }
        select option { background: #16161a; }
      `}</style>

      <Sidebar active={page === "profile" ? "companies" : page} setActive={p => { setPage(p); setSelectedCompany(null); }} lists={lists} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#0d0d0f", borderBottom: "1px solid #1e1e24", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
          <input placeholder="Global search… (⌘K)" style={{ flex: 1, maxWidth: 400, background: "#16161a", border: "1px solid #2a2a33", borderRadius: 8, padding: "7px 14px", color: "#ccc", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
          <div style={{ fontSize: 11, color: "#333", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{MOCK_COMPANIES.length} COMPANIES · CSV SEED</div>
        </div>
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {page === "companies" && !selectedCompany && <CompaniesPage onSelect={c => { setSelectedCompany(c); setPage("profile"); }} lists={lists} addToList={addToList} />}
          {page === "profile" && selectedCompany && <CompanyProfile company={selectedCompany} onBack={() => { setSelectedCompany(null); setPage("companies"); }} lists={lists} addToList={addToList} />}
          {page === "lists" && <ListsPage lists={lists} setLists={setLists} />}
          {page === "saved" && <SavedPage onGoToCompanies={() => setPage("companies")} />}
        </main>
      </div>
    </div>
  );
}