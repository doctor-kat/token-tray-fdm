// The meshed geometry the worker posts back for three.js to render — the
// contract shared between the builder (producer) and the viewer (consumer).

type FaceGroup = { start: number; count: number; faceId: number };
type EdgeGroup = { start: number; count: number; edgeId: number };

// replicad's `shape.mesh()` / `shape.meshEdges()` outputs. Buffers are plain
// number arrays; groups index into the triangle/line buffers.
export type FaceMesh = {
  vertices: number[];
  triangles: number[];
  normals?: number[];
  faceGroups?: FaceGroup[];
};
export type EdgeMesh = {
  lines: number[];
  edgeGroups?: EdgeGroup[];
};

export type MeshData = { faces: FaceMesh; edges: EdgeMesh };

// Concatenate several independently-meshed parts into one MeshData. Each part
// is meshed on its own (so its normals are correct — meshing solids together
// mangles them), then the raw buffers are appended with the index/group offsets
// fixed up so a single three.js BufferGeometry can render them all.
export function combineMeshes(parts: MeshData[]): MeshData {
  if (parts.length === 1) {
    return parts[0];
  }

  const vertices: number[] = [];
  const normals: number[] = [];
  const triangles: number[] = [];
  const faceGroups: FaceGroup[] = [];
  const lines: number[] = [];
  const edgeGroups: EdgeGroup[] = [];

  let vertexOffset = 0; // in vertices (3 numbers each)
  let indexOffset = 0; // in triangle-index elements
  let faceIdOffset = 0;
  let pointOffset = 0; // in edge points (3 numbers each)
  let edgeIdOffset = 0;
  let hasNormals = true;

  for (const { faces, edges } of parts) {
    for (const v of faces.vertices) {
      vertices.push(v);
    }
    if (faces.normals && faces.normals.length === faces.vertices.length) {
      for (const n of faces.normals) {
        normals.push(n);
      }
    } else {
      hasNormals = false;
    }
    for (const t of faces.triangles) {
      triangles.push(t + vertexOffset);
    }
    let maxFaceId = -1;
    for (const g of faces.faceGroups ?? []) {
      faceGroups.push({
        start: g.start + indexOffset,
        count: g.count,
        faceId: g.faceId + faceIdOffset,
      });
      maxFaceId = Math.max(maxFaceId, g.faceId);
    }

    for (const l of edges.lines) {
      lines.push(l);
    }
    let maxEdgeId = -1;
    for (const g of edges.edgeGroups ?? []) {
      edgeGroups.push({
        start: g.start + pointOffset,
        count: g.count,
        edgeId: g.edgeId + edgeIdOffset,
      });
      maxEdgeId = Math.max(maxEdgeId, g.edgeId);
    }

    vertexOffset += faces.vertices.length / 3;
    indexOffset += faces.triangles.length;
    faceIdOffset += maxFaceId + 1;
    pointOffset += edges.lines.length / 3;
    edgeIdOffset += maxEdgeId + 1;
  }

  return {
    faces: { vertices, triangles, normals: hasNormals ? normals : undefined, faceGroups },
    edges: { lines, edgeGroups },
  };
}
