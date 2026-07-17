/**
 * Reverse-engineered "Token Tray (FDM)" generator from
 * https://deckinabox.sgenoud.com/token-tray-fdm
 *
 * Built on replicad (https://replicad.xyz) — same library the site uses.
 *
 * The parameter schema below was recovered by decoding the site's
 * `?saved=` URLs: they are zip files containing a JSON document named
 * "token-tray-fdm-v1" with this shape:
 *
 * {
 *   "height": 77, "width": 170, "depth": 25,
 *   "outerWallThickness": 1.8,
 *   "wallThickness": 1.2,
 *   "sideFillet": 3,
 *   "bottomFillet": 6,
 *   "structure": {              // recursive binary/n-ary split tree
 *     "id": "...uuid...",
 *     "children": [ ...nodes ],
 *     "splitType": "vertical" | "horizontal" | null,
 *     "locked": false,
 *     "size": 0.4,              // fraction of the parent (siblings sum to 1)
 *     "customization": { "depth": null, "bottomFillet": null }
 *   }
 * }
 *
 * Leaf nodes of the tree become compartments; separator walls of
 * `wallThickness` are inserted between siblings. Each leaf can override
 * its depth (shallower compartment => thicker local floor) and its
 * bottom scoop fillet.
 */

/** @typedef { typeof import("replicad") } replicadLib */
/** @type {replicadLib} */
const { drawRoundedRectangle } = replicad;

export const defaultParams = {
  width: 170, // outer X dimension (mm)
  height: 77, // outer Y dimension (mm)
  depth: 25, // outer Z dimension (mm)
  outerWallThickness: 1.8,
  wallThickness: 1.2, // separator walls
  sideFillet: 3, // outer vertical corner radius
  bottomFillet: 6, // scoop radius at compartment bottoms
  rimFillet: 0.4, // small rounding of the top rim
};

// Example structure equivalent to what the site stores (a tray split in
// two columns; left column split in two rows, right column in rows of
// equal size). Edit freely — `size` values are fractions of the parent.
const structure = {
  splitType: "vertical",
  children: [
    {
      size: 0.4,
      splitType: "horizontal",
      children: [
        { size: 0.3, customization: { depth: null, bottomFillet: null } },
        { size: 0.7, customization: { depth: 12, bottomFillet: null } },
      ],
    },
    {
      size: 0.6,
      splitType: "horizontal",
      children: [
        { size: 0.25, customization: { depth: null, bottomFillet: null } },
        { size: 0.25, customization: { depth: null, bottomFillet: 3 } },
        { size: 0.5, customization: { depth: null, bottomFillet: null } },
      ],
    },
  ],
};

/**
 * Recursively turn the split tree into leaf rectangles.
 * rect = { x, y, w, h } with x,y the lower-left corner.
 */
function layoutCells(node, rect, wall) {
  const children = node.children ?? [];
  if (!children.length) return [{ rect, customization: node.customization }];

  const alongX = node.splitType === "vertical"; // vertical separators => children side by side in X
  const total = alongX ? rect.w : rect.h;
  const usable = total - (children.length - 1) * wall;

  let cursor = alongX ? rect.x : rect.y;
  const cells = [];
  for (const child of children) {
    const size = (child.size ?? 1 / children.length) * usable;
    const childRect = alongX
      ? { x: cursor, y: rect.y, w: size, h: rect.h }
      : { x: rect.x, y: cursor, w: rect.w, h: size };
    cells.push(...layoutCells(child, childRect, wall));
    cursor += size + wall;
  }
  return cells;
}

export default function main({
  width,
  height,
  depth,
  outerWallThickness,
  wallThickness,
  sideFillet,
  bottomFillet,
  rimFillet,
}) {
  // Outer body: rounded rectangle, flat bottom (FDM friendly)
  let body = drawRoundedRectangle(width, height, sideFillet)
    .sketchOnPlane("XY")
    .extrude(depth);

  // Inner area available for compartments
  const inner = {
    x: -width / 2 + outerWallThickness,
    y: -height / 2 + outerWallThickness,
    w: width - 2 * outerWallThickness,
    h: height - 2 * outerWallThickness,
  };

  const innerCorner = Math.max(sideFillet - outerWallThickness, 0.5);
  const cells = layoutCells(structure, inner, wallThickness);

  for (const { rect, customization } of cells) {
    const custom = customization ?? {};
    const cellDepth = Math.min(
      custom.depth ?? depth - outerWallThickness,
      depth - outerWallThickness
    );
    const floorZ = depth - cellDepth;

    // clamp the scoop so the fillet always fits the pocket
    const scoop = Math.max(
      0,
      Math.min(
        custom.bottomFillet ?? bottomFillet,
        cellDepth - 0.2,
        rect.w / 2 - 0.2,
        rect.h / 2 - 0.2
      )
    );
    const corner = Math.min(innerCorner, rect.w / 2 - 0.1, rect.h / 2 - 0.1);

    let pocket = drawRoundedRectangle(rect.w, rect.h, corner)
      .translate(rect.x + rect.w / 2, rect.y + rect.h / 2)
      .sketchOnPlane("XY", floorZ)
      .extrude(depth - floorZ + 1); // cut through the top

    if (scoop > 0.2) {
      pocket = pocket.fillet(scoop, (e) => e.inPlane("XY", floorZ));
    }

    body = body.cut(pocket);
  }

  // Soften the top rim (outer edge + all separator tops)
  if (rimFillet > 0) {
    body = body.fillet(Math.min(rimFillet, wallThickness / 2.5), (e) =>
      e.inPlane("XY", depth)
    );
  }

  return { shape: body, name: "Token Tray" };
}
