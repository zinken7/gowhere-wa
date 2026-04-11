export default defineEventHandler(() => {
  return {
    ok: true,
    service: 'GoWhere-wa',
    time: new Date().toISOString()
  }
})
