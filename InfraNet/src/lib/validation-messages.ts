export function formatValidationMessage(message: string) {
  return message
    .replaceAll("valido", "válido")
    .replaceAll("nao", "não")
    .replaceAll("recuperacao", "recuperação");
}
