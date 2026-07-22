# Third-party notices

This app's geometry is built with **[replicad](https://replicad.xyz)**, a browser CAD library by
QuaroTech Sàrl. `src/app/lib/model.ts`, `src/app/lib/lids.ts` and everything else that describes a
solid is written against replicad's API, and the kernel runs client-side in a web worker
(`src/app/builder/tray.worker.ts`).

Three packages from that project are used and are all MIT licensed, © 2023 QuaroTech Sàrl:

- `replicad` — the modelling API
- `replicad-opencascadejs` — the OpenCASCADE kernel compiled to WebAssembly
- `replicad-threejs-helper` — meshes replicad shapes into three.js buffers

The MIT text below is reproduced verbatim from those packages, satisfying the requirement that the
copyright and permission notice ship with the software.

## MIT License

Copyright 2023 QuaroTech Sàrl

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the “Software”), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## A note on the kernel itself

`replicad-opencascadejs` is MIT as a package, but the `.wasm` it ships is a build of
[OpenCASCADE Technology](https://dev.opencascade.org/), which is **LGPL-2.1 with an exception**,
not MIT. Shipping the kernel to the browser is the ordinary intended use and the exception is
written to permit it, but the OCCT terms are separate from the MIT grant above and should be
reviewed on their own terms before this is redistributed commercially.
