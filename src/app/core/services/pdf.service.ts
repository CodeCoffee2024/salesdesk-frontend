import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Document as DocumentModel } from '../models/document.model';

const PAGE_WIDTH_PT = 595;
const MARGIN_X = 48;
const RIGHT_EDGE = PAGE_WIDTH_PT - MARGIN_X;
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * Generates a downloadable PDF blob for a document, laid out directly with
 * jsPDF's text/line drawing API — not a DOM screenshot (no html2canvas), so the
 * output stays crisp and text-selectable rather than a rasterized image.
 */
@Injectable({
  providedIn: 'root'
})
export class PdfService {
  download(document: DocumentModel): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
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
      doc.text(CURRENCY_FORMATTER.format(item.unitPrice), 410, y);
      doc.text(CURRENCY_FORMATTER.format(item.lineTotal), RIGHT_EDGE, y, { align: 'right' });
      y += 22;
    });

    y += 8;
    doc.line(MARGIN_X, y, RIGHT_EDGE, y);
    y += 24;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Total due', 410, y);
    doc.text(CURRENCY_FORMATTER.format(document.total), RIGHT_EDGE, y, { align: 'right' });

    doc.save(`${document.documentNumber}.pdf`);
  }
}
