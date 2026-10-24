import { bomCatalog } from "./catalogs";

const estimatedCosts: Record<string, number> = {
  "cable-cat5e-utp": 1.5,
  "cable-cat5e-box": 457.5,
  "cable-cat6-utp": 4.43,
  "cable-cat6-box": 1349.99,
  "cable-cat6a-utp": 5.5,
  "cable-cat6a-box": 1677.5,
  "cable-cat6a-stp": 8,
  "cable-cat7": 9,
  "cable-cat8": 14,
  "patch-cord-cat5e": 9,
  "patch-cord-cat6": 14,
  "patch-cord-cat6a": 24,
  "fiber-om1": 8,
  "fiber-om2": 10,
  "fiber-om3": 14,
  "fiber-om4": 19,
  "fiber-om5": 28,
  "fiber-os2": 9,
  "fiber-drop": 2.5,
  "fiber-pigtail": 20,
  "fiber-patchcord": 35,
  "fiber-adapter": 16,
  "fiber-closure": 220,
  "fiber-tray": 450,
  "connector-rj45-cat5e": 1.5,
  "connector-rj45-cat6": 2.5,
  "connector-rj45-cat6a": 8,
  "keystone-cat5e": 14,
  "keystone-cat6": 20,
  "keystone-cat6a": 38,
  "faceplate-1": 6,
  "faceplate-2": 10,
  "surface-box": 15,
  "connector-fiber": 25,
  "coupler-rj45": 8,
  "rack-wall-5u": 300,
  "rack-wall-8u": 390,
  "rack-wall-12u": 550,
  "rack-floor-24u": 1450,
  "rack-floor-36u": 2150,
  "rack-floor-44u": 2850,
  "patch-panel-cat5e-24": 180,
  "patch-panel-cat6-24": 149,
  "patch-panel-cat6-48": 420,
  "patch-panel-cat6a-24": 360,
  "fiber-patch-panel": 480,
  "cable-manager-1u": 55,
  "cable-manager-vertical": 180,
  "rack-shelf": 110,
  "rack-pdu": 180,
  "rack-fan": 150,
  "rack-screws": 35,
  "cable-ties": 18,
  "velcro-roll": 35,
  "cable-duct": 12,
  conduit: 8,
  "switch-5-gigabit": 90,
  "switch-8-gigabit": 140,
  "switch-16-gigabit": 350,
  "switch-24-gigabit": 1455.9,
  "switch-48-gigabit": 900,
  "switch-poe-8": 550,
  "switch-poe-16": 1100,
  "switch-poe-24": 1900,
  "switch-managed": 900,
  "switch-sfp": 1800,
  router: 450,
  "access-point": 500,
  "transceiver-sfp": 220,
  ups: 750,
  "cable-install": 250,
  "fiber-splice": 60,
  "cable-testing": 80,
  labels: 0.5,
  "cleaning-kit": 100,
  "ground-wire": 5,
};

const verifiedReferences: Record<string, { sourceLabel: string; sourceUrl: string }> = {
  "cable-cat6-utp": {
    sourceLabel: "KaBuM! — cabo CAT6 WEC, caixa com 305 m",
    sourceUrl:
      "https://www.kabum.com.br/produto/904570/caixa-cabo-de-rede-305-metros-cat6-utp-4p-100-cobre-4px24awg-cm-int-wec-preto",
  },
  "cable-cat6-box": {
    sourceLabel: "KaBuM! — cabo CAT6 WEC, caixa com 305 m",
    sourceUrl:
      "https://www.kabum.com.br/produto/904570/caixa-cabo-de-rede-305-metros-cat6-utp-4p-100-cobre-4px24awg-cm-int-wec-preto",
  },
  "patch-panel-cat6-24": {
    sourceLabel: "KaBuM! — patch panel CAT6 de 24 portas",
    sourceUrl:
      "https://www.kabum.com.br/produto/1028004/patch-panel-cat6-24-portas-10-100-1000",
  },
  "switch-24-gigabit": {
    sourceLabel: "KaBuM! — switch TP-Link TL-SG1024DE, 24 portas",
    sourceUrl:
      "https://www.kabum.com.br/produto/650871/switch-gigabit-gerenciavel-de-24-portas-tp-link-easy-smart-plug-play-para-desktop-rackmount-em-metal-resistente-com-portas-blindadas-suporte-a-qos-vlan-igmp-lag-tl-sg1024de-preto",
  },
};

export const bomPriceReferences = bomCatalog.flatMap((group) =>
  group.items.map((item) => {
    const estimatedCost = estimatedCosts[item.id];
    if (estimatedCost === undefined) {
      throw new Error(`Preço estimado não cadastrado para o item da BOM "${item.id}".`);
    }

    const verifiedReference = verifiedReferences[item.id];
    return {
      ...item,
      estimatedCost,
      sourceLabel: verifiedReference?.sourceLabel ?? "Pesquisar cotações atuais",
      sourceUrl: verifiedReference?.sourceUrl ??
        `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.name)}`,
      isVerifiedReference: Boolean(verifiedReference),
    };
  })
);

export function findBomPriceReference(name: string, unit: string) {
  return bomPriceReferences.find((reference) => reference.name === name && reference.unit === unit);
}
