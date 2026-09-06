// A rejected write is different from a confirmed write whose refresh failed.
// The caller may close a form only after the write was acknowledged.
export async function persistAndRefresh(payload, fetcher = fetch) {
  let response;
  try {
    response = await fetcher('/api/data', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  } catch {
    return { ok: false, uncertain: true, error: '未收到保存回执，请先刷新核对记录，再决定是否重试' };
  }
  const body = await response.json();
  if (!response.ok) return { ok: false, error: body.error || '保存失败' };
  try {
    const read = await fetcher('/api/data', { cache: 'no-store' });
    const data = await read.json();
    if (!read.ok) throw new Error(data.error || '读取失败');
    return { ok: true, data };
  } catch {
    return { ok: true, refreshFailed: true, error: '已保存，但刷新失败。请刷新读取，勿重复提交' };
  }
}
