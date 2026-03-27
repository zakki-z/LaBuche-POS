import jsPDF from 'jspdf';

type CartItem = {
    id: number;
    name: string;
    price: number;
    quantity: number;
};

type ReceiptData = {
    orderId?: number;
    username: string;
    items: CartItem[];
    total: number;
    paidAmount: number;
    date: Date;
};

/**
 * Generates a styled receipt PDF and triggers a browser download.
 */
export function generateReceiptPDF(data: ReceiptData): void {
    // Receipt dimensions: 80mm wide thermal-style receipt
    const pageWidth = 80; // mm
    const pageHeight = 200; // mm (will auto-extend)
    const margin = 6;
    const contentWidth = pageWidth - margin * 2;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pageWidth, pageHeight],
    });

    let y = 10; // current vertical position

    const lineHeight = 4.5;
    const sectionGap = 3;

    // ── Helper functions ──────────────────────────────
    const centerText = (text: string, yPos: number, size: number, style: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, yPos);
    };

    const leftText = (text: string, yPos: number, size: number, style: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.text(text, margin, yPos);
    };

    const rightText = (text: string, yPos: number, size: number, style: 'normal' | 'bold' = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const textWidth = doc.getTextWidth(text);
        doc.text(text, pageWidth - margin - textWidth, yPos);
    };

    const drawDashedLine = (yPos: number) => {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        const dashLen = 1.5;
        const gapLen = 1;
        let x = margin;
        while (x < pageWidth - margin) {
            const end = Math.min(x + dashLen, pageWidth - margin);
            doc.line(x, yPos, end, yPos);
            x += dashLen + gapLen;
        }
    };

    const drawSolidLine = (yPos: number) => {
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    // ── Header / Store branding ───────────────────────
    // Logo square
    doc.setFillColor(194, 65, 12); // accent orange
    doc.roundedRect((pageWidth - 10) / 2, y, 10, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    centerText('G', y + 7.5, 14, 'bold');
    y += 14;

    doc.setTextColor(28, 25, 23);
    centerText('QuantPOS', y, 14, 'bold');
    y += 5;

    doc.setTextColor(120, 120, 120);
    centerText('Point of Sale Receipt', y, 7, 'normal');
    y += sectionGap + 3;

    drawSolidLine(y);
    y += sectionGap + 1;

    // ── Receipt metadata ──────────────────────────────
    const dateStr = data.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    const timeStr = data.date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    doc.setTextColor(100, 100, 100);
    leftText('Date:', y, 7, 'bold');
    rightText(dateStr, y, 7);
    y += lineHeight;

    leftText('Time:', y, 7, 'bold');
    rightText(timeStr, y, 7);
    y += lineHeight;

    if (data.orderId) {
        leftText('Order #:', y, 7, 'bold');
        rightText(String(data.orderId), y, 7);
        y += lineHeight;
    }

    leftText('Cashier:', y, 7, 'bold');
    rightText(data.username, y, 7);
    y += lineHeight;

    y += sectionGap;
    drawDashedLine(y);
    y += sectionGap + 2;

    // ── Column headers ────────────────────────────────
    doc.setTextColor(80, 80, 80);
    leftText('ITEM', y, 6.5, 'bold');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('QTY', margin + contentWidth * 0.55, y);

    doc.text('PRICE', margin + contentWidth * 0.72, y);

    const subtotalHeader = 'SUBTOTAL';
    const subtotalHeaderW = doc.getTextWidth(subtotalHeader);
    doc.text(subtotalHeader, pageWidth - margin - subtotalHeaderW, y);

    y += lineHeight - 0.5;
    drawDashedLine(y);
    y += lineHeight;

    // ── Line items ────────────────────────────────────
    doc.setTextColor(28, 25, 23);

    data.items.forEach((item) => {
        const lineTotal = item.price * item.quantity;

        // Item name (truncate if too long)
        const maxNameWidth = contentWidth * 0.5;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        let displayName = item.name;
        while (doc.getTextWidth(displayName) > maxNameWidth && displayName.length > 3) {
            displayName = displayName.slice(0, -1);
        }
        if (displayName !== item.name) displayName += '…';
        doc.text(displayName, margin, y);

        // Quantity
        doc.text(String(item.quantity), margin + contentWidth * 0.55, y);

        // Unit price
        doc.text(`$${item.price.toFixed(2)}`, margin + contentWidth * 0.72, y);

        // Line subtotal (right-aligned)
        const lineTotalStr = `$${lineTotal.toFixed(2)}`;
        const lineTotalW = doc.getTextWidth(lineTotalStr);
        doc.text(lineTotalStr, pageWidth - margin - lineTotalW, y);

        y += lineHeight + 0.5;
    });

    y += sectionGap - 1;
    drawSolidLine(y);
    y += sectionGap + 2;

    // ── Totals section ────────────────────────────────
    const itemCount = data.items.reduce((sum, i) => sum + i.quantity, 0);

    doc.setTextColor(80, 80, 80);
    leftText(`Items: ${itemCount}`, y, 7);
    y += lineHeight + 1;

    // Grand total
    doc.setTextColor(28, 25, 23);
    leftText('TOTAL', y, 9, 'bold');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const totalStr = `$${data.total.toFixed(2)}`;
    const totalW = doc.getTextWidth(totalStr);
    doc.text(totalStr, pageWidth - margin - totalW, y);
    y += lineHeight + 2;

    // Paid amount
    doc.setTextColor(80, 80, 80);
    leftText('Paid', y, 7);
    rightText(`$${data.paidAmount.toFixed(2)}`, y, 7);
    y += lineHeight;

    // Change
    const change = data.paidAmount - data.total;
    if (change >= 0) {
        leftText('Change', y, 7);
        rightText(`$${change.toFixed(2)}`, y, 7);
    } else {
        leftText('Remaining', y, 7);
        doc.setTextColor(220, 38, 38);
        rightText(`$${Math.abs(change).toFixed(2)}`, y, 7);
    }
    y += sectionGap + 3;

    drawDashedLine(y);
    y += sectionGap + 4;

    // ── Footer ────────────────────────────────────────
    doc.setTextColor(140, 140, 140);
    centerText('Thank you for your purchase!', y, 7, 'bold');
    y += lineHeight + 1;
    centerText('Powered by QuantPOS', y, 6);
    y += lineHeight;

    // ── Trigger download ──────────────────────────────
    const filename = data.orderId
        ? `receipt-order-${data.orderId}.pdf`
        : `receipt-${Date.now()}.pdf`;

    doc.save(filename);
}