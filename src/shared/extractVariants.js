const COLOR_HEX_MAP = {
  red: "#ff0000", blue: "#0000ff", green: "#008000",
  black: "#000000", white: "#ffffff", grey: "#808080", gray: "#808080",
  pink: "#ffc0cb", yellow: "#ffff00", orange: "#ff8c00",
  purple: "#800080", brown: "#8b4513", navy: "#000080",
  silver: "#c0c0c0", gold: "#ffd700", beige: "#f5f5dc",
  cream: "#fffdd0", maroon: "#800000", teal: "#008080",
  lavender: "#e6e6fa", coral: "#ff7f50", turquoise: "#40e0d0",
  khaki: "#f0e68c", indigo: "#4b0082", violet: "#ee82ee",
  tan: "#d2b48c", cyan: "#00ffff", magenta: "#ff00ff",
  olive: "#808000", lime: "#00ff00", ivory: "#fffff0",
  mauve: "#e0b0ff", peach: "#ffdab9", mint: "#98ff98",
  charcoal: "#36454f", burgundy: "#800020", rust: "#b7410e",
  salmon: "#fa8072", plum: "#dda0dd", sage: "#bcc6a8",
  cocoa: "#d2691e", wine: "#722f37", blush: "#de5d83",
  lemon: "#fff700", aqua: "#00ffff", apricot: "#fbceb1",
  lilac: "#c8a2c8", jade: "#00a86b", amber: "#ffbf00",
  carmine: "#960018", celeste: "#b2ffff", cerulean: "#007ba7",
  champagne: "#f7e7ce", chestnut: "#954535", cinnamon: "#d2691e",
  cobalt: "#0047ab", copper: "#b87333", crimson: "#dc143c",
  denim: "#1560bd", emerald: "#50c878", fuchsia: "#ff00ff",
  garnet: "#733635", hazel: "#8e7618", jet: "#0a0a0a",
  mahogany: "#c04000",
  ochre: "#cc7722", pewter: "#899499", rose: "#ff007f",
  ruby: "#e0115f", sapphire: "#0f52ba", scarlet: "#ff2400",
  sienna: "#a0522d", snow: "#fffafa", taupe: "#483c32",
  topaz: "#ffc87c", umber: "#635147", vermilion: "#e34234",
};

const nameToHex = (name) => {
  if (!name) return "#cccccc";
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("#") || lower.startsWith("rgb")) return trimmed;
  return COLOR_HEX_MAP[lower] || "#cccccc";
};

const extractVariants = (data) => {
  const result = { images: [], colors: [], sizes: [] };

  // --- Extract images ---
  let images = [];
  const raw = data.images || data.gallery || data.imageUrl || null;
  if (Array.isArray(raw) && raw.length > 0) {
    images = raw.map((img) =>
      typeof img === "string" ? img : (img?.url || "")
    ).filter(Boolean);
  }
  if (images.length === 0) {
    const single = data.image || data.thumbnail || data.imageUrl || "";
    const hover = data.hoverImage || "";
    images = [single, hover].filter(Boolean);
  }
  result.images = images;

  // --- Helper to parse attributes array ---
  const parseAttributeEntries = (entries) => {
    for (const attr of entries) {
      const attrName = (attr.attribute || attr.name || "").toLowerCase();
      const vals = Array.isArray(attr.values) ? attr.values.filter((v) => v !== "" && v !== null && v !== undefined) : [];
      if (attrName === "color" || attrName === "colour") {
        result.colors = vals.map((v) => ({ name: v, hex: nameToHex(v) }));
      } else if (attrName === "size") {
        result.sizes = vals.map((v) => String(v));
      }
    }
  };

  // 1. Check variantAttributes (saved by ProductVariantForm -> ProductUpsert)
  const variantAttributes = data.variantAttributes;
  if (Array.isArray(variantAttributes) && variantAttributes.length > 0) {
    parseAttributeEntries(variantAttributes);
  }

  // 2. Check data.variants
  if (result.colors.length === 0 || result.sizes.length === 0) {
    const variants = data.variants;

    if (variants && typeof variants === "object" && !Array.isArray(variants)) {
      // Object format: {Color: ["Red","Blue"], Size: ["S","M"]}
      const colorVals = variants.Color || variants.colour || variants.color || null;
      const sizeVals = variants.Size || variants.size || null;
      if (Array.isArray(colorVals) && colorVals.length > 0) {
        result.colors = colorVals.map((v) => ({ name: v, hex: nameToHex(v) }));
      }
      if (Array.isArray(sizeVals) && sizeVals.length > 0) {
        result.sizes = sizeVals.map((v) => String(v));
      }
    } else if (Array.isArray(variants) && variants.length > 0) {
      const hasAttributeArrays = variants.some(
        (v) => (v.attribute || v.name) && Array.isArray(v.values) && v.values.length > 0
      );

      if (hasAttributeArrays) {
        // Structure: [{attribute:"Color", values:["Red","Blue"]}, {attribute:"Size", values:["S","M"]}]
        // or [{name:"Color", values:["Red","Blue"]}, {name:"Size", values:["S","M"]}]
        parseAttributeEntries(variants);
      } else {
        const hasCombos = variants.some((v) => v.attribute && v.value !== undefined);
        if (hasCombos) {
          // Structure: [{attribute:"Color", value:"Red"}, {attribute:"Size", value:"S"}]
          const colorSet = new Set();
          const sizeSet = new Set();
          for (const combo of variants) {
            if (combo && typeof combo === "object" && combo.attribute && combo.value !== undefined) {
              const attrName = String(combo.attribute).toLowerCase();
              if (attrName === "color" || attrName === "colour") colorSet.add(combo.value);
              else if (attrName === "size") sizeSet.add(String(combo.value));
            }
          }
          if (colorSet.size > 0) result.colors = [...colorSet].map((v) => ({ name: v, hex: nameToHex(v) }));
          if (sizeSet.size > 0) result.sizes = [...sizeSet];
        } else {
          // Fallback: variant objects with {sku, price, stock} or {name, hex} or {size, color}
          const colorSet = new Set();
          const sizeSet = new Set();
          for (const v of variants) {
            if (v && typeof v === "object") {
              if (v.color || v.colour) colorSet.add(v.color || v.colour);
              if (v.size) sizeSet.add(String(v.size));
              if (v.hex || v.colorHex) colorSet.add(v.name || v.color || "Variant");
              if (v.name && !v.hex && !v.colorHex) {
                const lower = String(v.name).toLowerCase();
                if (["s", "m", "l", "xl", "xxl", "xs", "small", "medium", "large", "extra large"].includes(lower)) {
                  sizeSet.add(v.name);
                } else if (!/^[a-z]+$/i.test(v.name) || lower.length > 3) {
                  colorSet.add(v.name);
                }
              }
            }
          }
          if (colorSet.size > 0) result.colors = [...colorSet].map((v) => ({ name: v, hex: nameToHex(v) }));
          if (sizeSet.size > 0) result.sizes = [...sizeSet];
        }
      }
    }
  }

  // 3. Check top-level color fields
  if (result.colors.length === 0) {
    const topColors = data.colors || data.colour || data.color || data.productColors || null;
    if (Array.isArray(topColors) && topColors.length > 0) {
      result.colors = topColors.map((v) => {
        if (typeof v === "string") return { name: v, hex: nameToHex(v) };
        if (v && typeof v === "object") {
          return { name: v.name || v.color || "Color", hex: v.hex || v.colorHex || nameToHex(v.name || v.color || "") };
        }
        return { name: String(v), hex: "#cccccc" };
      });
    } else if (typeof topColors === "string" && topColors) {
      result.colors = [{ name: topColors, hex: nameToHex(topColors) }];
    }
  }

  // 4. Check top-level size fields
  if (result.sizes.length === 0) {
    const topSizes = data.sizes || data.size || data.productSizes || null;
    if (Array.isArray(topSizes) && topSizes.length > 0) {
      result.sizes = topSizes.map((v) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object") return v.label || v.value || v.name || v.size || String(v);
        return String(v);
      }).filter(Boolean);
    } else if (typeof topSizes === "string" && topSizes) {
      result.sizes = [topSizes];
    }
  }

  return result;
};

export { extractVariants, nameToHex };
