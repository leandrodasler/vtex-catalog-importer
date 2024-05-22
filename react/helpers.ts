export const goToSettings = () => {
  window.parent.location.href = `/admin/apps/${process.env.VTEX_APP_ID}/setup/`
}
