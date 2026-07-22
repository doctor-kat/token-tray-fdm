// Bambu Lab Matte PLA swatches, used as the model-color palette in the viewer.
// Hex values approximate Bambu's published matte swatches — close enough for a
// print preview, not a color-managed proof. Names match Bambu's product names.
export type Filament = { name: string; hex: string };

export const bambuMattePLA: Filament[] = [
  { name: "Ivory White", hex: "#FFFFFF" },
  { name: "Bone White", hex: "#CBC6B8" },
  { name: "Ash Grey", hex: "#9B9EA0" },
  { name: "Nardo Grey", hex: "#757575" },
  { name: "Dark Grey", hex: "#545454" },
  { name: "Charcoal", hex: "#000000" },
  { name: "Latte Brown", hex: "#D3B7A7" },
  { name: "Desert Tan", hex: "#E8DBB7" },
  { name: "Caramel", hex: "#AE835B" },
  { name: "Dark Brown", hex: "#7D6556" },
  { name: "Terracotta", hex: "#B15533" },
  { name: "Mandarin Orange", hex: "#F99963" },
  { name: "Scarlet Red", hex: "#DE4343" },
  { name: "Dark Red", hex: "#BB3D43" },
  { name: "Sakura Pink", hex: "#E8AFCF" },
  { name: "Lilac Purple", hex: "#AE96D4" },
  { name: "Grape Purple", hex: "#583061" },
  { name: "Ice Blue", hex: "#A3D8E1" },
  { name: "Sky Blue", hex: "#56B7E6" },
  { name: "Marine Blue", hex: "#0078BF" },
  { name: "Dark Blue", hex: "#042F56" },
  { name: "Apple Green", hex: "#8FBF3F" },
  { name: "Grass Green", hex: "#61C680" },
  { name: "Dark Green", hex: "#68724D" },
  { name: "Lemon Yellow", hex: "#F7D959" },
];

export const defaultFilament = bambuMattePLA[18]; // Marine Blue
