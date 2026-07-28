import { leaf, type Rect, type SplitNode, type SplitType, uid } from "./model";

// All operations return a new tree (immutable) so React state updates cleanly.

function defaultCustomization() {
  return {
    depth: null,
    bottomFillet: null,
    autoW: true,
    autoL: true,
  };
}

function clone(node: SplitNode): SplitNode {
  return {
    ...node,
    customization: { ...node.customization },
    children: node.children.map(clone),
  };
}

function normalizeSizes(children: SplitNode[]): SplitNode[] {
  const total = children.reduce((s, c) => s + c.size, 0) || 1;
  return children.map((c) => ({ ...c, size: c.size / total }));
}

function transform(
  node: SplitNode,
  id: string,
  fn: (n: SplitNode, parent: SplitNode | null) => void,
  parent: SplitNode | null = null,
): SplitNode {
  const copy: SplitNode = {
    ...node,
    customization: { ...node.customization },
    children: node.children.map((c) => transform(c, id, fn, node)),
  };
  if (copy.id === id) {
    fn(copy, parent);
  }

  return copy;
}

export function findNode(node: SplitNode, id: string): SplitNode | null {
  if (node.id === id) {
    return node;
  }

  for (const c of node.children) {
    const found = findNode(c, id);
    if (found) {
      return found;
    }
  }

  return null;
}

export function findParent(node: SplitNode, id: string): SplitNode | null {
  for (const c of node.children) {
    if (c.id === id) {
      return node;
    }

    const found = findParent(c, id);
    if (found) {
      return found;
    }
  }

  return null;
}

// Split a leaf into two children along the given direction. If the node is
// already split in the same direction, append a new sibling instead.
export function splitCell(
  root: SplitNode,
  id: string,
  splitType: Exclude<SplitType, undefined>,
): SplitNode {
  return transform(clone(root), id, (node) => {
    if (node.children.length === 0) {
      node.splitType = splitType;
      node.children = normalizeSizes([leaf(0.5), leaf(0.5)]);
      node.customization = defaultCustomization();
    } else if (node.splitType === splitType) {
      node.children = normalizeSizes([...node.children, leaf(1)]);
    } else {
      // Wrap current content and add a sibling in the new direction.
      const inner: SplitNode = {
        id: uid(),
        size: 0.5,
        splitType: node.splitType,
        customization: defaultCustomization(),
        children: node.children,
      };
      node.splitType = splitType;
      node.children = normalizeSizes([inner, leaf(0.5)]);
    }
  });
}

// Insert a new neighbor leaf next to `id`, on the given side. Reuses the
// parent split if its axis already matches; otherwise wraps the target node
// in a new split along the required axis. Returns the new tree + new leaf id.
export function addNeighbor(
  root: SplitNode,
  id: string,
  side: "left" | "right" | "top" | "bottom",
): { tree: SplitNode; newId: string } {
  const dir: Exclude<SplitType, undefined> =
    side === "left" || side === "right" ? "vertical" : "horizontal";
  const isBefore = side === "left" || side === "top";
  const t = clone(root);
  const newLeaf = leaf(1);

  const parent = findParent(t, id);
  if (parent?.splitType === dir) {
    const idx = parent.children.findIndex((c) => c.id === id);
    parent.children.splice(isBefore ? idx : idx + 1, 0, newLeaf);
    parent.children = normalizeSizes(parent.children);
    return { tree: t, newId: newLeaf.id };
  }

  const target = findNode(t, id);
  if (!target) {
    return { tree: t, newId: id };
  }

  const targetCopy: SplitNode = {
    id: target.id,
    size: 1,
    splitType: target.splitType,
    children: target.children,
    customization: target.customization,
  };
  target.splitType = dir;
  target.children = normalizeSizes(isBefore ? [newLeaf, targetCopy] : [targetCopy, newLeaf]);
  target.customization = defaultCustomization();
  return { tree: t, newId: newLeaf.id };
}

// Remove a child; if only one child remains, collapse it into the parent.
export function removeCell(root: SplitNode, id: string): SplitNode {
  if (root.id === id) {
    return root;
  } // Never remove the root

  const walk = (node: SplitNode): SplitNode => {
    let children: SplitNode[] = [];
    for (const c of node.children) {
      if (c.id !== id) {
        children.push(walk(c));
      }
    }

    if (children.length === 1 && node.splitType) {
      // Collapse: adopt the single remaining child's content
      const only = children[0];
      return {
        ...node,
        splitType: only.splitType,
        children: only.children,
        customization: only.children.length > 0 ? node.customization : only.customization,
      };
    }

    return { ...node, children: normalizeSizes(children) };
  };

  return walk(clone(root));
}

// Rebalance a set of siblings so their sizes sum to 1 after one changed.
export function setSizeBalanced(
  root: SplitNode,
  parentId: string,
  childId: string,
  size: number,
): SplitNode {
  return transform(clone(root), parentId, (parent) => {
    const idx = parent.children.findIndex((c) => c.id === childId);
    if (idx === -1) {
      return;
    }

    const clamped = Math.max(0.05, Math.min(0.95, size));
    const others = parent.children.filter((c) => c.id !== childId);
    const othersTotal = others.reduce((s, c) => s + c.size, 0) || 1;
    const remaining = 1 - clamped;
    parent.children = parent.children.map((c) =>
      c.id === childId
        ? { ...c, size: clamped }
        : { ...c, size: (c.size / othersTotal) * remaining },
    );
  });
}

export function setCustomization(
  root: SplitNode,
  id: string,
  patch: Partial<SplitNode["customization"]>,
): SplitNode {
  return transform(clone(root), id, (node) => {
    node.customization = { ...node.customization, ...patch };
  });
}

// Absolute rect (mm) for every node in the tree, keyed by id — mirrors
// layoutCells but retains internal (non-leaf) nodes too, so a leaf's
// containing split at any depth can be measured.
export function layoutNodeRects(
  node: SplitNode,
  rect: Rect,
  wall: number,
  out = new Map<string, Rect>(),
): Map<string, Rect> {
  out.set(node.id, rect);
  const children = node.children ?? [];
  if (children.length === 0) {
    return out;
  }

  const isAlongX = node.splitType === "vertical";
  const total = isAlongX ? rect.w : rect.h;
  const usable = total - (children.length - 1) * wall;

  let cursor = isAlongX ? rect.x : rect.y;
  for (const child of children) {
    const size = (child.size ?? 1 / children.length) * usable;
    const childRect: Rect = isAlongX
      ? {
          x: cursor,
          y: rect.y,
          w: size,
          h: rect.h,
        }
      : {
          x: rect.x,
          y: cursor,
          w: rect.w,
          h: size,
        };
    layoutNodeRects(child, childRect, wall, out);
    cursor += size + wall;
  }

  return out;
}

// Set a leaf's width or length to an absolute mm target by finding the
// nearest ancestor split whose axis matches, and rebalancing that split's
// children so the target child hits the requested size.
export function setLeafDimMm(
  root: SplitNode,
  leafId: string,
  axis: "w" | "l",
  targetMm: number,
  innerRect: Rect,
  wall: number,
): SplitNode {
  const wantDir: Exclude<SplitType, undefined> = axis === "w" ? "vertical" : "horizontal";

  // Build path root -> leaf.
  const path: SplitNode[] = [];
  const build = (n: SplitNode): boolean => {
    path.push(n);
    if (n.id === leafId) {
      return true;
    }

    for (const c of n.children) {
      if (build(c)) {
        return true;
      }
    }

    path.pop();
    return false;
  };

  if (!build(root)) {
    return root;
  }

  let containerIdx = -1;
  for (let i = path.length - 2; i >= 0; i--) {
    if (path[i].splitType === wantDir) {
      containerIdx = i;
      break;
    }
  }

  if (containerIdx < 0) {
    return root;
  }

  const container = path[containerIdx];
  const child = path[containerIdx + 1];
  const rects = layoutNodeRects(root, innerRect, wall);
  const containerRect = rects.get(container.id);
  if (!containerRect) {
    return root;
  }

  const available = axis === "w" ? containerRect.w : containerRect.h;
  const usable = available - (container.children.length - 1) * wall;
  if (usable <= 0) {
    return root;
  }

  const fraction = Math.max(0.02, Math.min(0.98, targetMm / usable));
  const t = setSizeBalanced(root, container.id, child.id, fraction);
  return setCustomization(t, leafId, axis === "w" ? { autoW: false } : { autoL: false });
}
