import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { formatCurrency } from '../utils/locale.util';

const PAGE_WIDTH_PT = 595;
const MARGIN_X = 48;
const RIGHT_EDGE = PAGE_WIDTH_PT - MARGIN_X;

/**
 * The document fields the PDF layout actually reads — a structural subset both the
 * authenticated `Document` and the public `PublicDocument` shape satisfy, so one
 * PdfService serves the internal preview page and the anonymous /view/:token page.
 */
export interface PdfDocumentSource {
  type: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  customerName: string;
  customerCompany: string;
  total: number;
  /** ISO 4217 code this document is priced in (TASK-029) — drives the same Intl.NumberFormat-based rendering used in Live Preview and the Public Client Portal, not a separate hardcoded formatter. */
  currency: string;
  /** Optional ISO 3166-1 alpha-2 target country, used alongside currency to pick the display locale (TASK-029). */
  clientCountry: string | null;
  lineItems: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
}

/** Rendered onto the PDF's final page (TASK-024 AC4) when the document has been e-signed. */
export interface PdfSignatureInfo {
  signerName: string;
  signedAtUtc: string;
  signatureImageDataUrl: string;
}

/**
 * Generates a downloadable PDF blob for a document, laid out directly with
 * jsPDF's text/line drawing API — not a DOM screenshot (no html2canvas), so the
 * output stays crisp and text-selectable rather than a rasterized image.
 */
@Injectable({
  providedIn: 'root'
})
export class PdfService {
  download(document: PdfDocumentSource, signature?: PdfSignatureInfo | null): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const money = (amount: number) => formatCurrency(amount, document.currency, document.clientCountry);
    let y = 56;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(document.type === 'Invoice' ? 'Invoice' : 'Quote', MARGIN_X, y);

    doc.setFontSize(11);
    doc.text(document.documentNumber, RIGHT_EDGE, y, { align: 'right' });

    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Issued ${document.issueDate}`, RIGHT_EDGE, y, { align: 'right' });
    y += 13;
    doc.text(`Due ${document.dueDate}`, RIGHT_EDGE, y, { align: 'right' });

    y = 130;
    doc.setFontSize(9);
    doc.text('PREPARED FOR', MARGIN_X, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(document.customerName, MARGIN_X, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(document.customerCompany, MARGIN_X, y);

    y += 40;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', MARGIN_X, y);
    doc.text('QTY', 340, y);
    doc.text('RATE', 410, y);
    doc.text('AMOUNT', RIGHT_EDGE, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(200);
    doc.line(MARGIN_X, y, RIGHT_EDGE, y);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    document.lineItems.forEach((item) => {
      doc.text(item.description, MARGIN_X, y, { maxWidth: 270 });
      doc.text(String(item.quantity), 340, y);
      doc.text(money(item.unitPrice), 410, y);
      doc.text(money(item.lineTotal), RIGHT_EDGE, y, { align: 'right' });
      y += 22;
    });

    y += 8;
    doc.line(MARGIN_X, y, RIGHT_EDGE, y);
    y += 24;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Total due', 410, y);
    doc.text(money(document.total), RIGHT_EDGE, y, { align: 'right' });

    if (signature) {
      y += 50;
      doc.setDrawColor(200);
      doc.line(MARGIN_X, y, RIGHT_EDGE, y);
      y += 20;

      // The signature PNG (drawn stroke trace or rasterized cursive text) is
      // embedded as-is — both signature types are already the same image format
      // by the time they reach here, see SignatureCanvasComponent.
      if (signature.signatureImageDataUrl) {
        doc.addImage(signature.signatureImageDataUrl, 'PNG', MARGIN_X, y, 160, 60);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 115, 112);
      doc.text(`Signed by ${signature.signerName}`, MARGIN_X, y + 74);
      doc.text(`on ${new Date(signature.signedAtUtc).toLocaleString()}`, MARGIN_X, y + 87);
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`${document.documentNumber}.pdf`);
  }
}
