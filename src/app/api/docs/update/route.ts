import { NextRequest, NextResponse } from 'next/server';
import { processDocUpdateForPR, processDocUpdateForLinear } from '@/lib/doc-update-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required fields: type and id' },
        { status: 400 }
      );
    }

    if (type !== 'pr' && type !== 'linear') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "pr" or "linear"' },
        { status: 400 }
      );
    }

    let result;
    if (type === 'pr') {
      result = await processDocUpdateForPR(id);
    } else {
      result = await processDocUpdateForLinear(id);
    }

    return NextResponse.json({
      success: true,
      docPrUrl: result.docPrUrl,
      docPrNumber: result.docPrNumber,
      filesUpdated: result.filesUpdated,
      branchName: result.branchName,
    });
  } catch (error) {
    console.error('Error processing doc update:', error);
    return NextResponse.json(
      {
        error: 'Failed to process documentation update',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
