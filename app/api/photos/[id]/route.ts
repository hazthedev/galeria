// ============================================
// Galeria - Photo Delete API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthForApi, verifyPhotoModerationAccess } from '@/lib/domain/auth/auth';
import { deletePhotoManually } from '@/lib/moderation/service';

// ============================================
// DELETE /api/photos/:id - Delete photo
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: photoId } = await params;
    const headers = request.headers;

    // Authenticate and get user info
    const { payload, userId, tenantId: authTenantId } = await requireAuthForApi(headers, request.method);

    // Verify access
    const { isOwner, isAdmin } = await verifyPhotoModerationAccess(
      photoId,
      authTenantId,
      userId,
      payload.role
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : null;
    const result = await deletePhotoManually({
      tenantId: authTenantId,
      photoId,
      moderatorId: userId,
      reason,
    });

    if (result.outcome === 'missing') {
      return NextResponse.json(
        { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (result.outcome === 'skipped') {
      return NextResponse.json(
        { error: result.message, code: 'INVALID_STATE', currentStatus: result.status },
        { status: 409 }
      );
    }

    return NextResponse.json({
      data: { id: photoId, status: 'deleted' },
      message: result.message,
    });
  } catch (error) {
    console.error('[API] Delete photo error:', error);

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('Authentication required')) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      if (errorMessage.includes('Photo not found')) {
        return NextResponse.json(
          { error: 'Photo not found', code: 'PHOTO_NOT_FOUND' },
          { status: 404 }
        );
      }

      if (errorMessage.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      if (errorMessage.includes('READ_ONLY_IMPERSONATION')) {
        return NextResponse.json(
          { error: 'Support mode is read-only', code: 'READ_ONLY_IMPERSONATION' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete photo', code: 'DELETE_ERROR' },
      { status: 500 }
    );
  }
}
