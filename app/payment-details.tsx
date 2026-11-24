"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Copy, CreditCard, Ellipsis, Lightbulb, Pencil, Undo2 } from "lucide-react";
import { formatAmount, formatDate, type Payment } from "@/lib/payments";

function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return <><button className="detail-copy" aria-label={`Copy ${label}`} title={copied ? "Copied" : `Copy ${label}`} onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }}>{copied ? <Check size={13}/> : <Copy size={13}/>}</button><span className="sr-only" aria-live="polite">{copied ? `${label} copied` : ""}</span></>;
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="detail-field"><strong>{label}</strong><div>{children}</div></div>;
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return <div className="detail-empty">{children}</div>;
}

export default function PaymentDetails({ payment, loading, query }: { payment?: Payment; loading: boolean; query: string }) {
  const [riskTab, setRiskTab] = useState<"Risk factors" | "Risk scores">("Risk factors");
  const [methodOpen, setMethodOpen] = useState(false);
  if (loading) return <section className="detail-content"><p>Loading payment…</p></section>;
  if (!payment) return <section className="detail-content"><Link href={`/${query}`} className="detail-link">Transactions</Link><h1>Payment not found</h1><p>This payment could not be found in the demo data.</p></section>;
  const statusText = payment.status === "Pending" ? "Payment pending" : `Payment ${payment.status.toLowerCase()}`;
  return <section className="detail-content">
    <Link href={`/${query}`} className="detail-back">Transactions</Link>
    <div className="detail-title-row"><div><div className="detail-title"><h1>{formatAmount(payment)} <span>{payment.currency}</span></h1><span className={`badge ${payment.status.toLowerCase()}`}>{payment.status}</span></div><p>Charged to <span className="detail-link">{payment.email}</span></p></div><div className="detail-actions"><button className="outline-button" disabled title="Refunds are not available in this demo"><Undo2 size={14}/> Refund</button><button className="outline-button" disabled aria-label="More payment actions" title="More actions are not available in this demo"><Ellipsis size={16}/></button></div></div>
    <div className="detail-grid"><div className="detail-main">
      <section className="detail-section activity-section"><div className="section-heading"><h2>Recent activity</h2><button className="outline-button" disabled title="Notes are not available in this demo">Add note</button></div><div className="timeline"><div className="timeline-row"><span className="timeline-dot active-dot"/><strong>{statusText}</strong><time>{formatDate(payment.created)}</time></div><div className="timeline-row"><span className="timeline-dot"/><strong>Payment started</strong><time>{formatDate(payment.created)}</time></div></div></section>
      <section className="detail-section"><h2>Payment breakdown</h2><div className="breakdown"><div><strong>Payment amount</strong><strong>{formatAmount(payment)} {payment.currency}</strong></div><div><span>Stripe processing fees <span className="underlined">Learn more</span></span><span>—</span></div><div><strong>Net amount</strong><strong>—</strong></div></div><p className="detail-footnote">Processing fees and net amounts are not included in the sample data.</p></section>
      <section className="detail-section"><h2>Payment method</h2><button className="detail-method" onClick={() => setMethodOpen(!methodOpen)} aria-expanded={methodOpen}><ChevronRight size={16} className={methodOpen ? "rotated" : ""}/><span className={`brand ${payment.brand.toLowerCase().replace(" ", "-")}`}>{payment.brand === "Mastercard" ? "●●" : payment.brand === "Visa" ? "VISA" : payment.brand === "Amex" ? "AMEX" : payment.method === "Wallet" ? "Pay" : "ACH"}</span><span>•••• {payment.last4}</span><span className="method-name">{payment.brand}</span></button>{methodOpen && <div className="method-expanded">{payment.method} · {payment.brand} ending in {payment.last4}</div>}<div className="enabled-methods">Enabled payment methods<div><CreditCard size={17}/></div></div></section>
      <section className="detail-section"><h2>Tax calculation</h2><EmptyBox><span>No tax rate applied.</span><span><Lightbulb size={14}/> Calculate tax automatically on future invoices using Stripe Tax. <span className="detail-link">Start now</span></span></EmptyBox></section>
      <section className="detail-section"><h2>Risk analysis</h2><div className="risk-tabs">{(["Risk factors", "Risk scores"] as const).map((tab) => <button key={tab} className={riskTab === tab ? "active" : ""} onClick={() => setRiskTab(tab)}>{tab}</button>)}</div><div className="risk-empty">Risk insights are only available for live data.</div></section>
      <section className="detail-section"><h2>Related payments</h2><EmptyBox>No related payments in this sample data.</EmptyBox></section>
      <section className="detail-section"><h2>Related objects</h2><div className="related-objects"><DetailField label="Latest charge">—</DetailField><DetailField label="Payout">—</DetailField></div></section>
      <section className="detail-section"><div className="section-heading"><h2>Receipt history</h2><div className="detail-actions"><button className="outline-button" disabled title="Receipts are not available in this demo">View receipt</button><button className="outline-button" disabled title="Receipts are not available in this demo">Send receipt</button></div></div><EmptyBox>No receipts sent</EmptyBox></section>
      <section className="detail-section"><h2>Events</h2><EmptyBox>No events available for this sample payment.</EmptyBox></section>
      <section className="detail-section"><h2>Logs</h2><EmptyBox>No logs</EmptyBox></section>
    </div><aside className="detail-aside">
      <section><h2>Details</h2><DetailField label="Payment ID"><span className="break-anywhere">{payment.id}</span> <CopyValue value={payment.id} label="payment ID"/></DetailField><DetailField label="Payment method"><span className={`brand ${payment.brand.toLowerCase().replace(" ", "-")}`}>{payment.brand === "Visa" ? "VISA" : payment.brand === "Mastercard" ? "●●" : payment.brand === "Amex" ? "AMEX" : payment.method === "Wallet" ? "Pay" : "ACH"}</span> &nbsp;•••• {payment.last4}</DetailField><DetailField label="Risk level">Not available</DetailField><DetailField label="Description">Subscription update</DetailField><DetailField label="Statement descriptor">—</DetailField><DetailField label="Funds available">—</DetailField><DetailField label="Last updated">{formatDate(payment.created)}</DetailField></section>
      <section><h2>Customer</h2><DetailField label="ID">—</DetailField><DetailField label="Name">—</DetailField><DetailField label="Description">—</DetailField><DetailField label="Email"><span className="break-anywhere">{payment.email}</span> <CopyValue value={payment.email} label="email"/></DetailField><DetailField label="Phone">—</DetailField><DetailField label="Country">—</DetailField></section>
      <section><div className="section-heading"><h2>Metadata</h2><button className="outline-button" disabled aria-label="Edit metadata" title="Metadata editing is not available in this demo"><Pencil size={13}/></button></div><EmptyBox>No metadata</EmptyBox></section>
    </aside></div>
  </section>;
}
