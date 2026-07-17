import { leaf, uid, type SplitNode, type SplitType } from "./model";

// All operations return a new tree (immutable) so React state updates cleanly.

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
  parent: SplitNode | null = null
): SplitNode {
  const copy: SplitNode = {
    ...node,
    customization: { ...node.customization },
    children: node.children.map((c) => transform(c, id, fn, node)),
  };
  if (copy.id === id) fn(copy, parent);
  return copy;
}

// Split a leaf into two children along the given direction. If the node is
// already split in the same direction, append a new sibling instead.
export function splitCell(
  root: SplitNode,
  id: string,
  splitType: Exclude<SplitType, null>
): SplitNode {
  return transform(clone(root), id, (node) => {
    if (!node.children.length) {
      node.splitType = splitType;
      node.children = normalizeSizes([leaf(0.5), leaf(0.5)]);
      node.customization = { depth: null, bottomFillet: null };
    } else if (node.splitType === splitType) {
      node.children = normalizeSizes([...node.children, leaf(1)]);
    } else {
      // Wrap current content and add a sibling in the new direction.
      const inner: SplitNode = {
        id: uid(),
        size: 0.5,
        splitType: node.splitType,
        customization: { depth: null, bottomFillet: null },
        children: node.children,
      };
      node.splitType = splitType;
      node.children = normalizeSizes([inner, leaf(0.5)]);
    }
  });
}

// Remove a child; if only one child remains, collapse it into the parent.
export function removeCell(root: SplitNode, id: string): SplitNode {
  if (root.id === id) return root; // never remove the root
  const walk = (node: SplitNode): SplitNode => {
    let children = node.children
      .filter((c) => c.id !== id)
      .map(walk);
    if (node.children.length && !children.length) children = [];
    if (children.length === 1 && node.splitType) {
      // collapse: adopt the single remaining child's content
      const only = children[0];
      return {
        ...node,
        splitType: only.splitType,
        children: only.children,
        customization: only.children.length
          ? node.customization
          : only.customization,
      };
    }
    return { ...node, children: normalizeSizes(children) };
  };
  return walk(clone(root));
}

export function setSize(root: SplitNode, id: string, size: number): SplitNode {
  return transform(clone(root), id, (node) => {
    node.size = Math.max(0.05, size);
  });
}

// Rebalance a set of siblings so their sizes sum to 1 after one changed.
export function setSizeBalanced(
  root: SplitNode,
  parentId: string,
  childId: string,
  size: number
): SplitNode {
  return transform(clone(root), parentId, (parent) => {
    const idx = parent.children.findIndex((c) => c.id === childId);
    if (idx < 0) return;
    const clamped = Math.max(0.05, Math.min(0.95, size));
    const others = parent.children.filter((c) => c.id !== childId);
    const othersTotal = others.reduce((s, c) => s + c.size, 0) || 1;
    const remaining = 1 - clamped;
    parent.children = parent.children.map((c) =>
      c.id === childId
        ? { ...c, size: clamped }
        : { ...c, size: (c.size / othersTotal) * remaining }
    );
  });
}

export function setCustomization(
  root: SplitNode,
  id: string,
  patch: Partial<SplitNode["customization"]>
): SplitNode {
  return transform(clone(root), id, (node) => {
    node.customization = { ...node.customization, ...patch };
  });
}
