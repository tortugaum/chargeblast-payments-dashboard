"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowDown, ArrowDownUp, ArrowLeftRight, ArrowUp, BarChart3, Bell, Box, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, CirclePlus, Copy, CreditCard, Ellipsis, ExternalLink, GripVertical, Grid2X2, Home, Info, Layers2, LogOut, Menu, Plus, Search, Settings, Sparkles, Upload, UserRound, Users, Wallet, X } from "lucide-react";
import { createPayments, formatAmount, formatDate, initialFilters, methods, relativeDate, selectPayments, statuses, type Filters, type Method, type Payment, type Sort, type Status } from "@/lib/payments";
import PaymentDetails from "@/app/payment-details";
import { filtersFromSearch, searchFromFilters } from "@/lib/filter-url";
import { columnKeys, columnLabels, defaultWidths, maxWidth, minWidth, moveColumn, readColumnLayout, type ColumnKey } from "@/lib/columns";

type Panel = "date" | "status" | "method" | "amount" | "account" | "workspace" | "columns" | null;
const dateLabels: Record<string, string> = { all: "Date and time", today: "Today", "7": "Last 7 days", "30": "Last 30 days", custom: "Custom date" };

function FilterPopover({ label, active, open, onClick, children }: { label: string; active: boolean; open: boolean; onClick: () => void; children: React.ReactNode }) {
  return <div className="filter-wrap"><button className={`filter-chip ${active ? "filter-active" : ""}`} onClick={onClick} aria-expanded={open}><CirclePlus size={13}/>{label}</button>{open && <div className="popover">{children}</div>}</div>;
}

function SortHeading({ label, field, sort, onSort }: { label: string; field: Sort["key"]; sort: Sort; onSort: (key: Sort["key"]) => void }) {
  const Icon = sort.key !== field ? ArrowDownUp : sort.direction === "asc" ? ArrowUp : ArrowDown;
  return <button className="sort-button" onClick={() => onSort(field)}>{label}<Icon size={12}/></button>;
}

function PaymentRow({ payment, now, selected, onSelect, order }: { payment: Payment; now: Date; selected: boolean; onSelect: () => void; order: ColumnKey[] }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const query = typeof window === "undefined" ? "" : window.location.search;
  async function copyId() {
    try { await navigator.clipboard.writeText(payment.id); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  }
  return <tr className="payment-row" onClick={(event) => { if (!(event.target as HTMLElement).closest("button, input, a, [tabindex]")) router.push(`/payments/${payment.id}${query}`); }}>
    <td className="checkbox-cell"><input type="checkbox" aria-label={`Select payment ${payment.id}`} checked={selected} onChange={onSelect}/></td>
    {order.map((key) => <td key={key} className={key === "customer" ? "customer" : key === "description" ? "description" : undefined}>{key === "amount" ? <><Link className="amount payment-link" href={`/payments/${payment.id}${query}`}>{formatAmount(payment)}</Link> <span className="currency">{payment.currency}</span></> : key === "status" ? <span className={`badge ${payment.status.toLowerCase()}`}>{payment.status} {payment.status === "Succeeded" ? "✓" : payment.status === "Failed" ? "×" : payment.status === "Pending" ? "·" : "↶"}</span> : key === "method" ? <div className="method-cell"><span className={`brand ${payment.brand.toLowerCase().replace(" ", "-")}`}>{payment.brand === "Mastercard" ? "●●" : payment.brand === "Visa" ? "VISA" : payment.brand === "Amex" ? "AMEX" : payment.method === "Wallet" ? "Pay" : "ACH"}</span><span>•••• {payment.last4}</span></div> : key === "description" ? "Subscription update" : key === "customer" ? payment.email : key === "created" ? <span className="date-tooltip" tabIndex={0}>{formatDate(payment.created)}<span role="tooltip">{relativeDate(payment.created, now)}</span></span> : <div className="id-cell"><span title={payment.id}>{payment.id.slice(0, 12)}…</span><button className="copy-button" aria-label={`Copy payment ID ${payment.id}`} title={copied ? "Copied" : "Copy payment ID"} onClick={copyId}>{copied ? <Check size={14}/> : <Copy size={14}/>}</button><span className="sr-only" aria-live="polite">{copied ? "Payment ID copied" : ""}</span></div>}</td>)}
  </tr>;
}

export default function PaymentsDashboard({ paymentId }: { paymentId?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<Sort>({ key: "created", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [panel, setPanel] = useState<Panel>(null);
  const [showNotice, setShowNotice] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([...columnKeys]);
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>({ ...defaultWidths });
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [columnAnnouncement, setColumnAnnouncement] = useState("");
  const resizeStart = useRef<{ key: ColumnKey; x: number; width: number } | null>(null);
  const filterBar = useRef<HTMLDivElement>(null);
  const accountArea = useRef<HTMLDivElement>(null);
  const workspaceArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anchor = new Date();
    try { const saved = sessionStorage.getItem("payments-demo-anchor"); if (saved && !Number.isNaN(Date.parse(saved))) anchor = new Date(saved); else sessionStorage.setItem("payments-demo-anchor", anchor.toISOString()); } catch { /* Storage is optional. */ }
    setNow(anchor);
    try { const layout = readColumnLayout(localStorage.getItem("payments-column-layout")); setColumnOrder(layout.order); setColumnWidths(layout.widths); } catch { /* Storage is optional. */ }
    setFilters(filtersFromSearch(window.location.search));
    function restoreFilters() { setFilters(filtersFromSearch(window.location.search)); setPage(1); }
    window.addEventListener("popstate", restoreFilters);
    return () => window.removeEventListener("popstate", restoreFilters);
  }, []);
  useEffect(() => {
    function close(event: MouseEvent) { const target = event.target as Node; if (!filterBar.current?.contains(target) && !accountArea.current?.contains(target) && !workspaceArea.current?.contains(target)) setPanel(null); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setPanel(null); }
    document.addEventListener("mousedown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);
  const payments = useMemo(() => now ? createPayments(now) : [], [now]);
  const results = useMemo(() => now ? selectPayments(payments, filters, sort, now) : [], [payments, filters, sort, now]);
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = rows.length > 0 && rows.every((payment) => selectedIds.includes(payment.id));
  function saveLayout(order: ColumnKey[], widths: Record<ColumnKey, number>) { try { localStorage.setItem("payments-column-layout", JSON.stringify({ order, widths })); } catch { /* Storage is optional. */ } }
  function reorder(from: ColumnKey, to: ColumnKey) { const next = moveColumn(columnOrder, from, to); setColumnOrder(next); saveLayout(next, columnWidths); setColumnAnnouncement(`${columnLabels[from]} moved to position ${next.indexOf(from) + 1} of ${next.length}.`); }
  function resize(key: ColumnKey, value: number) { const width = Math.max(minWidth, Math.min(maxWidth, Math.round(value))); const next = { ...columnWidths, [key]: width }; setColumnWidths(next); saveLayout(columnOrder, next); }
  function resetColumns() { setColumnOrder([...columnKeys]); setColumnWidths({ ...defaultWidths }); saveLayout([...columnKeys], { ...defaultWidths }); setColumnAnnouncement("Column layout reset."); }
  function toggleAll() { setSelectedIds((previous) => allSelected ? previous.filter((id) => !rows.some((row) => row.id === id)) : Array.from(new Set([...previous, ...rows.map((row) => row.id)]))); }
  function exportCsv() {
    const values = [["Payment ID", "Customer", "Amount", "Currency", "Status", "Payment method", "Last 4", "Created"], ...results.map((payment) => [payment.id, payment.email, (payment.amount / 100).toFixed(2), payment.currency, payment.status, payment.brand, payment.last4, payment.created])];
    const csv = values.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "payments.csv"; link.click(); URL.revokeObjectURL(url);
  }
  function update(patch: Partial<Filters>, replace = Object.keys(patch).length === 1 && "search" in patch) {
    const next = { ...filters, ...patch };
    const query = searchFromFilters(next, window.location.search);
    const url = `${window.location.pathname}${query}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      if (replace) window.history.replaceState(null, "", url); else window.history.pushState(null, "", url);
    }
    setFilters(next); setPage(1);
  }
  async function copyShareLink() {
    try { await navigator.clipboard.writeText(window.location.href); setShareMessage("Link copied"); }
    catch { setShareMessage("Copy the link from your address bar"); }
    window.setTimeout(() => setShareMessage(""), 3000);
  }
  function togglePanel(next: Panel) { setPanel((current) => current === next ? null : next); }
  function toggleStatus(status: Status) { update({ statuses: filters.statuses.includes(status) ? filters.statuses.filter((item) => item !== status) : [...filters.statuses, status] }); }
  function toggleMethod(method: Method) { update({ methods: filters.methods.includes(method) ? filters.methods.filter((item) => item !== method) : [...filters.methods, method] }); }
  function changeSort(key: Sort["key"]) { setSort((previous) => ({ key, direction: previous.key === key && previous.direction === "asc" ? "desc" : "asc" })); setPage(1); }
  const hasFilters = Boolean(filters.search || filters.date !== "all" || filters.statuses.length || filters.methods.length || filters.min || filters.max);

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="workspace-area" ref={workspaceArea}>
        <div className="workspace"><button className={`workspace-trigger ${panel === "workspace" ? "is-open" : ""}`} aria-expanded={panel === "workspace"} aria-haspopup="true" onClick={() => togglePanel("workspace")}><span className="workspace-icon">✦</span><strong>Acme, Inc.</strong><ChevronDown size={14}/></button><button className="close-nav" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
        {panel === "workspace" && <div className="workspace-menu" role="region" aria-label="Account menu">
          <div className="workspace-menu-header"><span className="workspace-menu-avatar">A</span><strong>Acme, Inc.</strong><span>Acme, Inc.</span></div>
          <div className="workspace-menu-primary"><button disabled title="Not available in this demo">Exit account</button></div>
          <div className="workspace-menu-section"><button disabled title="Not available in this demo"><Settings size={17}/><span>Settings</span></button><button disabled title="Not available in this demo"><Box size={17}/><span>Switch account</span><ChevronRight size={15}/></button><button disabled title="Not available in this demo"><Plus size={18}/><span>Create</span><ChevronRight size={15}/></button></div>
          <div className="workspace-menu-section workspace-menu-user"><button disabled title="Not available in this demo"><UserRound size={17}/><span>Acme, Inc.</span><Info size={14}/></button><button disabled title="Not available in this demo"><LogOut size={17}/><span>Sign out</span></button></div>
        </div>}
      </div>
      <nav aria-label="Main navigation">
        <div className="nav-item"><Home/>Home</div><div className="nav-item"><Wallet/>Balances</div><div className="nav-item selected"><ArrowLeftRight/>Transactions</div><div className="nav-item"><Users/>Customers</div><div className="nav-item"><Box/>Product catalog</div>
        <div className="nav-heading">Shortcuts</div><div className="nav-item"><Activity/>Payments analytics</div><div className="nav-item"><BarChart3/>Reports</div><div className="nav-item"><Layers2/>Sigma</div><div className="nav-item"><CircleHelp/>Radar</div>
        <div className="nav-heading">Products</div><div className="nav-item"><Layers2/>Connect <ChevronDown className="nav-chevron"/></div><div className="nav-item"><CreditCard/>Payments <ChevronDown className="nav-chevron"/></div><div className="nav-item"><Box/>Billing <ChevronDown className="nav-chevron"/></div><div className="nav-item"><BarChart3/>Reporting <ChevronDown className="nav-chevron"/></div><div className="nav-item"><Ellipsis/>More</div>
      </nav><div className="sidebar-bottom">⌘ &nbsp; Developers</div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}><Menu size={19}/></button><div className="top-search"><Search size={15}/><input aria-label="Search payments by ID, email, or last 4" placeholder="Search" value={filters.search} onChange={(event) => update({ search: event.target.value })}/>{filters.search && <button aria-label="Clear search" onClick={() => update({ search: "" })}><X size={14}/></button>}</div><div className="top-right" ref={accountArea}><span className="test-label">Test mode has moved. <span className="show-me">Show me</span></span><div className="app-switcher" aria-label="Connected apps (illustrative)"><span className="app-icon app-one">◧</span><span className="app-icon app-two">◎</span><span className="app-icon app-three">↗</span><Grid2X2 size={15}/></div><CircleHelp size={17}/><Bell size={17}/><Settings size={17}/><button className="avatar" aria-label="Account menu" aria-expanded={panel === "account"} onClick={() => togglePanel("account")}><Plus size={14}/></button>{panel === "account" && <div className="account-menu"><strong>Acme, Inc.</strong><span>Demo account</span><small>Test data · No real payments</small></div>}</div></header>
      {paymentId ? <PaymentDetails payment={payments.find((payment) => payment.id === paymentId)} loading={!now} query={searchFromFilters(filters)}/> : <section className="content">
        <div className="title-row"><h1>Transactions</h1><div className="title-actions"><button className="create-button" disabled title="Creating payments is not available in this demo"><Plus size={14}/> Create payment</button><button className="outline-button" disabled title="Analytics is not available in this demo"><BarChart3 size={13}/> Analyze</button></div></div>
        <div className="tabs"><span className="tab-active">Payments</span><span>Payouts</span><span>Top-ups</span><span>Collected fees</span><span>Transfers</span><span>All activity</span></div>
        {showNotice && <div className="notice"><Sparkles size={14}/><strong>New</strong><span>Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.</span><span className="notice-link">Get started</span><button aria-label="Dismiss announcement" onClick={() => setShowNotice(false)}><X size={15}/></button></div>}
        <div className="status-tabs" aria-label="Quick status filters">{["All", "Succeeded", "Refunded", "Disputed", "Failed", "Uncaptured"].map((item) => <button key={item} disabled={item === "Disputed" || item === "Uncaptured"} title={item === "Disputed" || item === "Uncaptured" ? "Not available in this demo" : undefined} className={(item === "All" ? filters.statuses.length === 0 : filters.statuses.length === 1 && filters.statuses[0] === item) ? "active" : ""} onClick={() => update({ statuses: item === "All" ? [] : [item as Status] })}>{item}</button>)}</div>
        <div className="toolbar" ref={filterBar}>
          <div className="filters">
            <FilterPopover label={dateLabels[filters.date]} active={filters.date !== "all"} open={panel === "date"} onClick={() => togglePanel("date")}><div className="popover-title">Date and time</div>{[["all", "All time"], ["today", "Today"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["custom", "Custom"]].map(([value, label]) => <label className="option" key={value}><input type="radio" name="date" checked={filters.date === value} onChange={() => update({ date: value })}/>{label}</label>)}{filters.date === "custom" && <div className="range-fields"><label>From<input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => update({ from: event.target.value })}/></label><label>To<input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => update({ to: event.target.value })}/></label></div>}</FilterPopover>
            <FilterPopover label={filters.min || filters.max ? "Amount · Active" : "Amount"} active={!!(filters.min || filters.max)} open={panel === "amount"} onClick={() => togglePanel("amount")}><div className="popover-title">Amount</div><p className="popover-note">Compare numeric amounts in their original currency.</p><div className="range-fields"><label>Minimum<input type="number" min="0" step="0.01" placeholder="0.00" value={filters.min} onChange={(event) => update({ min: event.target.value })}/></label><label>Maximum<input type="number" min="0" step="0.01" placeholder="0.00" value={filters.max} onChange={(event) => update({ max: event.target.value })}/></label></div>{filters.min && filters.max && Number(filters.min) > Number(filters.max) && <p className="error">Minimum must not exceed maximum.</p>}</FilterPopover>
            <button className="filter-chip unavailable" disabled title="Currency filter is not available in this demo"><CirclePlus size={13}/>Currency</button>
            <FilterPopover label={filters.statuses.length ? `Status · ${filters.statuses.length}` : "Status"} active={!!filters.statuses.length} open={panel === "status"} onClick={() => togglePanel("status")}><div className="popover-title">Status</div>{statuses.map((status) => <label className="option" key={status}><input type="checkbox" checked={filters.statuses.includes(status)} onChange={() => toggleStatus(status)}/>{status}</label>)}</FilterPopover>
            <FilterPopover label={filters.methods.length ? `Payment method · ${filters.methods.length}` : "Payment method"} active={!!filters.methods.length} open={panel === "method"} onClick={() => togglePanel("method")}><div className="popover-title">Payment method</div>{methods.map((method) => <label className="option" key={method}><input type="checkbox" checked={filters.methods.includes(method)} onChange={() => toggleMethod(method)}/>{method}</label>)}</FilterPopover>
            <button className="filter-chip unavailable" disabled title="Additional filters are not available in this demo"><CirclePlus size={13}/>More filters</button>
            {hasFilters && <button className="clear-filters" onClick={() => { update(initialFilters); setPanel(null); }}>Clear filters</button>}
          </div><div className="toolbar-actions"><button className="outline-button" onClick={copyShareLink}><Copy size={13}/> {shareMessage || "Share filters"}</button><button className="outline-button" onClick={exportCsv}><Upload size={13}/> Export</button><div className="filter-wrap"><button className="outline-button" aria-expanded={panel === "columns"} onClick={() => togglePanel("columns")}><Settings size={13}/> Edit columns</button>{panel === "columns" && <div className="popover column-help"><div className="popover-title">Edit columns</div><p>Drag the grip to reorder columns, or use its left and right arrow keys. Drag a column edge to resize, or focus it and use the arrow keys.</p><button className="outline-button" onClick={resetColumns}>Reset columns</button></div>}</div><span className="sr-only" aria-live="polite">{shareMessage}</span></div>
        </div>
        <div className="table-scroll"><table className="resizable-table" style={{ width: 38 + columnOrder.reduce((sum, key) => sum + columnWidths[key], 0) }}><colgroup><col style={{ width: 38 }}/>{columnOrder.map((key) => <col key={key} style={{ width: columnWidths[key] }}/>)}</colgroup><thead><tr><th className="checkbox-cell"><input type="checkbox" aria-label="Select all payments on this page" checked={allSelected} onChange={toggleAll} disabled={!rows.length}/></th>{columnOrder.map((key, index) => {
          const sortable = key === "amount" || key === "status" || key === "created";
          return <th key={key} className={`column-heading ${draggedColumn === key ? "column-dragging" : ""}`} aria-sort={sortable ? (sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none") : undefined} onDragOver={(event) => { if (draggedColumn && draggedColumn !== key) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (draggedColumn) reorder(draggedColumn, key); setDraggedColumn(null); }}>
            <div className="column-heading-inner"><button className="column-grip" draggable aria-label={`Move ${columnLabels[key]} column`} title="Drag to reorder, or use left and right arrow keys" onDragStart={(event) => { setDraggedColumn(key); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", key); }} onDragEnd={() => setDraggedColumn(null)} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); const target = columnOrder[index + (event.key === "ArrowLeft" ? -1 : 1)]; if (target) reorder(key, target); } }}><GripVertical size={13}/></button>{sortable ? <SortHeading label={columnLabels[key]} field={key} sort={sort} onSort={changeSort}/> : <span>{columnLabels[key]}</span>}</div>
            <div className="column-resizer" role="separator" tabIndex={0} aria-label={`Resize ${columnLabels[key]} column`} aria-orientation="vertical" aria-valuemin={minWidth} aria-valuemax={maxWidth} aria-valuenow={columnWidths[key]} title="Drag to resize, or use left and right arrow keys" onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); resizeStart.current = { key, x: event.clientX, width: columnWidths[key] }; }} onPointerMove={(event) => { if (resizeStart.current?.key === key && event.currentTarget.hasPointerCapture(event.pointerId)) resize(key, resizeStart.current.width + event.clientX - resizeStart.current.x); }} onPointerUp={() => { resizeStart.current = null; }} onPointerCancel={() => { resizeStart.current = null; }} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); resize(key, columnWidths[key] + (event.key === "ArrowLeft" ? -10 : 10)); } }}/>
          </th>;
        })}</tr></thead><tbody>{now && rows.map((payment) => <PaymentRow key={payment.id} payment={payment} now={now} order={columnOrder} selected={selectedIds.includes(payment.id)} onSelect={() => setSelectedIds((previous) => previous.includes(payment.id) ? previous.filter((id) => id !== payment.id) : [...previous, payment.id])}/>)}</tbody></table>{now && !results.length && <div className="empty"><Search size={21}/><strong>No payments found</strong><span>Try adjusting your search or filters.</span><button onClick={() => update(initialFilters)}>Clear filters</button></div>}{!now && <div className="empty">Loading payments…</div>}<span className="sr-only" aria-live="polite">{columnAnnouncement}</span></div>
        <footer className="table-footer"><span>{results.length ? `Viewing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, results.length)} of ${results.length.toLocaleString()} results` : "0 results"}</span><div className="pagination"><label>Rows per page <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option>25</option><option>50</option><option>100</option></select></label><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={14}/> Previous</button><button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next <ChevronRight size={14}/></button></div></footer>
        <p className="disclaimer">Sample data for demonstration purposes. <ExternalLink size={12}/></p>
      </section>}
    </main>
  </div>;
}
