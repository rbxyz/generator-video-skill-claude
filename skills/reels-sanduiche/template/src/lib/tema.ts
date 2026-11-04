import { continueRender, delayRender, staticFile } from "remotion";

/** Paleta e tipografia. Troque aqui pela identidade visual da marca. */
export const COR = {
  tinta: "#0E0D14",
  creme: "#F2EEE5",
  roxo: "#8C82F2",
  roxoForte: "#6A5CF0",
  vermelho: "#E5484D",
  cinza: "#9A97A6",
};

export const FONTE = {
  titulo: "Anton, sans-serif",
  corpo: "Inter, sans-serif",
  mao: "Caveat, cursive",
};

const ARQUIVOS: [string, string, string][] = [
  ["Anton", "Anton-Regular.ttf", "400"],
  ["Inter", "Inter.ttf", "100 900"],
  ["Caveat", "Caveat.ttf", "400 700"],
];

if (typeof document !== "undefined") {
  const h = delayRender("fontes");
  Promise.all(
    ARQUIVOS.map(([fam, arq, peso]) =>
      new FontFace(fam, `url(${staticFile(`fonts/${arq}`)})`, { weight: peso })
        .load()
        .then((f) => document.fonts.add(f)),
    ),
  ).then(() => continueRender(h));
}
