export function normalizeInfrastructureLocation(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]/gu, "");
}
