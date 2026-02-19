export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (process.env.MODERATION_QUEUE_ENABLED !== 'true') {
    console.log('[MODERATION] Queue worker disabled (MODERATION_QUEUE_ENABLED != true)');
    return;
  }

  try {
    const { initializeContentModeration } = await import('@/lib/moderation/init');
    await initializeContentModeration();
  } catch (error) {
    console.error('[MODERATION] Failed to initialize moderation worker:', error);
  }
}
