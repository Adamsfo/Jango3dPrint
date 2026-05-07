import lampMoon from "@/assets/lamp-moon.jpg";
import lampBunny from "@/assets/lamp-bunny.jpg";
import lampCloud from "@/assets/lamp-cloud.jpg";
import lampStar from "@/assets/lamp-star.jpg";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  story: string;
  description: string;
  basePrice: number;
  category: "Bichinhos" | "Céu & Natureza" | "Personalizadas";
  image: string;
  gallery: string[];
  colors: { name: string; hex: string }[];
  sizes: { name: string; priceDelta: number }[];
  power: { name: string; priceDelta: number }[];
  intensity: string[];
  leadTimeDays: number;
};

export const products: Product[] = [
  {
    slug: "luminaria-nuvem",
    name: "Nuvem Sonhadora",
    tagline: "Sonhos que iluminam noites pequeninas",
    story:
      "Nasceu de um pedido especial: uma mãe queria que o quarto da filha fosse um céu. Cada Nuvem é impressa em camadas finíssimas para difundir a luz como luar.",
    description:
      "Luminária em formato de nuvem com luz quente regulável. Acabamento fosco aveludado, base em madeira clara opcional.",
    basePrice: 189,
    category: "Céu & Natureza",
    image: lampCloud,
    gallery: [lampCloud, lampMoon, lampStar],
    colors: [
      { name: "Branco Nuvem", hex: "#fafbfc" },
      { name: "Areia", hex: "#ede4d3" },
      { name: "Rosê", hex: "#f3d9d4" },
    ],
    sizes: [
      { name: "P · 14cm", priceDelta: 0 },
      { name: "M · 18cm", priceDelta: 40 },
      { name: "G · 24cm", priceDelta: 90 },
    ],
    power: [
      { name: "USB", priceDelta: 0 },
      { name: "Tomada bivolt", priceDelta: 25 },
    ],
    intensity: ["Suave", "Média", "Aconchegante"],
    leadTimeDays: 7,
  },
  {
    slug: "luminaria-lua",
    name: "Lua Cheia",
    tagline: "A noite mais aconchegante do quarto",
    story:
      "Inspirada nas primeiras noites em casa, a Lua Cheia traz a luz dourada do amanhecer para velar o sono.",
    description:
      "Globo translúcido impresso em PLA premium com base minimalista. Difusão de luz uniforme e quente.",
    basePrice: 219,
    category: "Céu & Natureza",
    image: lampMoon,
    gallery: [lampMoon, lampStar, lampCloud],
    colors: [
      { name: "Branco Lua", hex: "#f8f4ec" },
      { name: "Marfim", hex: "#efe7d6" },
    ],
    sizes: [
      { name: "M · 16cm", priceDelta: 0 },
      { name: "G · 22cm", priceDelta: 80 },
    ],
    power: [
      { name: "USB", priceDelta: 0 },
      { name: "Tomada bivolt", priceDelta: 25 },
    ],
    intensity: ["Suave", "Média", "Forte"],
    leadTimeDays: 6,
  },
  {
    slug: "luminaria-coelho",
    name: "Coelho Soninho",
    tagline: "Companhia silenciosa para boas noites",
    story:
      "Pedido por uma família que queria substituir o abajur frio por um amigo. O Coelho Soninho virou o melhor amigo de quem tem medo do escuro.",
    description:
      "Bichinho impresso em peça única com luz interior difusa. Toque suave e seguro para crianças.",
    basePrice: 239,
    category: "Bichinhos",
    image: lampBunny,
    gallery: [lampBunny, lampCloud, lampStar],
    colors: [
      { name: "Branco", hex: "#fbf8f2" },
      { name: "Areia", hex: "#ecdfc8" },
      { name: "Rosê", hex: "#f1d3cd" },
    ],
    sizes: [
      { name: "Único · 22cm", priceDelta: 0 },
    ],
    power: [
      { name: "USB", priceDelta: 0 },
      { name: "Bateria recarregável", priceDelta: 60 },
    ],
    intensity: ["Suave", "Média", "Aconchegante"],
    leadTimeDays: 9,
  },
  {
    slug: "luminaria-estrela",
    name: "Estrelinha",
    tagline: "Faça um pedido toda noite",
    story:
      "A primeira luminária da JANGO3D. Surgiu para o quartinho da nossa filha — e desde então acompanha milhares de soninhos.",
    description:
      "Estrela compacta sobre base em madeira clara. Perfeita para mesinha de cabeceira.",
    basePrice: 159,
    category: "Céu & Natureza",
    image: lampStar,
    gallery: [lampStar, lampMoon, lampBunny],
    colors: [
      { name: "Areia", hex: "#ecdfc8" },
      { name: "Branco", hex: "#fbf8f2" },
      { name: "Mel", hex: "#e6c79b" },
    ],
    sizes: [
      { name: "P · 13cm", priceDelta: 0 },
      { name: "M · 17cm", priceDelta: 30 },
    ],
    power: [
      { name: "USB", priceDelta: 0 },
      { name: "Tomada bivolt", priceDelta: 25 },
    ],
    intensity: ["Suave", "Média", "Forte"],
    leadTimeDays: 5,
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
