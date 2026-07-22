//app\api\comptable\salaires\bulletin\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { BulletinDePaiePDF, BulletinData } from '@/components/pdf/BulletinDePaie';
import React from 'react';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const data: BulletinData = await req.json();

    // Use absolute path for logo in Next.js backend environment for react-pdf if logoUrl is not provided
    if (!data.logoUrl) {
      data.logoUrl = path.join(process.cwd(), 'public', 'img', 'logo.jpg');
    }

    const pdfStream = await renderToStream(React.createElement(BulletinDePaiePDF, { data }));
    
    // Convert Node stream to web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err) => controller.error(err));
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Bulletin_${data.employe.nom}_${data.periode.replace(/ /g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
