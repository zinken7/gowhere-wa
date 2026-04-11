export default defineEventHandler(() => {
  return {
    ok: true,
    service: 'carepath-wa',
    time: new Date().toISOString()
  }
})
