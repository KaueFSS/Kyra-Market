/**
 * confirmDialog: substituto bonito do window.confirm.
 *
 *   const ok = await confirmDialog({
 *     title: "Excluir produtos",
 *     message: "Esta ação não pode ser desfeita.",
 *     confirmText: "Excluir",
 *     danger: true,
 *   });
 *   if (!ok) return;
 *
 * Funciona via CustomEvent — o componente <ConfirmDialog /> escuta e responde.
 */

export function confirmDialog(opts = {}) {
  return new Promise((resolve) => {
    const detail = {
      title:        opts.title        ?? "Confirmar ação",
      message:      opts.message      ?? "Tem certeza?",
      confirmText:  opts.confirmText  ?? "Confirmar",
      cancelText:   opts.cancelText   ?? "Cancelar",
      danger:       opts.danger       ?? false,
      icon:         opts.icon         ?? null,
      resolve,
    };
    window.dispatchEvent(new CustomEvent("mercadinho-confirm", { detail }));
  });
}
