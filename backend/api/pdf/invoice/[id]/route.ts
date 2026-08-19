import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/config/database';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/shared/templates/InvoicePDF';
import { auth } from '@/server/config/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const billing = await prisma.billing.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        generatedBy: true,
        lineItems: true,
      }
    });

    if (!billing) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    // Map lineItems to items array expected by template
    const items = billing.lineItems.map(li => ({
      serviceName: li.serviceName,
      unitPrice: li.unitPrice,
      quantity: li.quantity,
      taxAmount: li.taxAmount,
      totalAmount: li.totalAmount,
    }));

    // If billing items contains string array from legacy data
    if (billing.items && Array.isArray(billing.items) && billing.lineItems.length === 0) {
       billing.items.forEach((item: any) => {
         items.push({
           serviceName: String(item),
           unitPrice: billing.totalAmount,
           quantity: 1,
           taxAmount: billing.taxTotal || 0,
           totalAmount: billing.totalAmount,
         });
       });
    }

    const pdfData = {
      id: billing.id,
      invoiceNumber: billing.invoiceNumber || '',
      createdAt: billing.createdAt,
      patient: {
        name: billing.patient.name,
        phone: billing.patient.phone
      },
      generatedBy: {
        name: billing.generatedBy.name
      },
      items,
      subtotal: billing.totalAmount - (billing.taxTotal || 0) + (billing.discount || 0),
      discount: billing.discount || 0,
      taxTotal: billing.taxTotal || 0,
      totalAmount: billing.totalAmount,
      paidAmount: billing.paidAmount || 0,
      status: billing.status
    };

    const stream = await renderToStream(React.createElement(InvoicePDF, { data: pdfData }) as any);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice_${billing.invoiceNumber || billing.id.slice(-6)}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
