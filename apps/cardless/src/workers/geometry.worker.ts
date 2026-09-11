// Geometry worker for Cardless — Flazz card holder generator.
// No MX switch assets needed: the geometry is pure CSG.
import Module from 'manifold-3d';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import { buildCardHolder } from '../geometry/buildCardHolder';
import type { GeometryResponse } from '../types';

type Wasm = Awaited<ReturnType<typeof Module>>;

let modulePromise: Promise<Wasm> | null = null;

async function getModule(): Promise<Wasm> {
  if (!modulePromise) {
    modulePromise = (async () => {
      const wasm = await Module({ locateFile: () => wasmUrl });
      wasm.setup();
      return wasm;
    })();
  }
  return modulePromise;
}

function post(msg: GeometryResponse, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(msg, transfer);
}

self.onmessage = async (e: MessageEvent<any>) => {
  try {
    const wasm = await getModule();
    const msg = e.data;

    // For cardless we skip MX asset loading entirely.
    // When mount.ts sends 'init', we immediately respond 'initDone' with stubs.
    if (msg.type === 'init') {
      post({
        type: 'initDone',
        socketInfo: 'n/a (cardless)',
        stemInfo: 'n/a (cardless)',
        switchInfo: 'n/a (cardless)',
        switchMesh: { vertProperties: new Float32Array(0), triVerts: new Uint32Array(0), numProp: 3 },
        switchColumnMm: 0,
      });
      return;
    }

    if (msg.type === 'buildCardHolder') {
      const { parts, switchPlacements, warnings } = buildCardHolder(
        wasm,
        null, // no socket needed
        null, // no stem needed
        msg.regions,
        msg.outline,
        msg.params,
      );
      const transfer: Transferable[] = [];
      for (const p of parts) transfer.push(p.vertProperties.buffer, p.triVerts.buffer);
      post({ type: 'parts', parts, switchPlacements, warnings, requestId: msg.requestId }, transfer);
      return;
    }

    // Ignore other message types (buildBlocks, buildFitStrip) — not used in cardless.

  } catch (err) {
    post({
      type: 'error',
      message: err instanceof Error ? (err.stack ?? err.message) : String(err),
    });
  }
};

post({ type: 'ready' });
