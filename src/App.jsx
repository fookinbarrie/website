import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

import PasswordPage from './PasswordPage';
import TextNode from './TextNode';
import SpotifyNode from './SpotifyNode';
import SpotifyStackNode from './SpotifyStackNode';
import ImageNode from './ImageNode';
import DecorationNode from './DecorationNode';
import NoteNode from './NoteNode';
import PolaroidNode from './PolaroidNode';
import ListNode from './ListNode';
import YouTubeNode from './YouTubeNode';
import PhotoBoxAlbumNode from './PhotoBoxAlbumNode';
import StickerNode from './StickerNode';
import { initialNodes, initialEdges } from './initialData';
import { useAudioControl } from './AudioControlContext';

const nodeTypes = {
  text: TextNode,
  spotify: SpotifyNode,
  spotifyStack: SpotifyStackNode,
  image: ImageNode,
  decoration: DecorationNode,
  note: NoteNode,
  polaroid: PolaroidNode,
  list: ListNode,
  youtube: YouTubeNode,
  photobox: PhotoBoxAlbumNode,
  sticker: StickerNode,
};

const defaultEdgeOptions = {
  style: { stroke: 'rgba(234, 128, 176, 0.22)', strokeWidth: 1 },
  type: 'smoothstep',
};

function App() {
  const { isUnlocked, unlock } = useAudioControl();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [draggable, setDraggable] = useState(false);
  const centeredRef = useRef(false);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Cheat codes — "433": log & copy positions, "open": unlock dragging
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  useEffect(() => {
    const buf = { current: '' };
    const onKey = (e) => {
      if (e.key.length !== 1) return;
      buf.current = (buf.current + e.key.toLowerCase()).slice(-5);
      // "433" → log & copy positions
      if (buf.current.slice(-3) === '433') {
        const output = nodesRef.current
          .map((n) => `${n.id}: { x: ${Math.round(n.position.x)}, y: ${Math.round(n.position.y)} }`)
          .join('\n');
        console.log('=== NODE POSITIONS ===\n' + output);
        navigator.clipboard.writeText(output).then(() => {
          alert('Posisi semua node sudah di-copy ke clipboard!\nBuka Console (F12) untuk lihat detail.');
        });
        buf.current = '';
      }
      // "open" → unlock dragging
      if (buf.current.endsWith('open')) {
        setDraggable(true);
        alert('🔓 Node dragging unlocked!');
        buf.current = '';
      }
      // "kocak" → bypass password & game, go straight to main
      if (buf.current.endsWith('kocak')) {
        buf.current = '';
        unlock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlock]);

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <>
      {!isUnlocked ? (
        <PasswordPage onUnlock={unlock} />
      ) : (
        <div className="w-screen h-screen theme-darkpink">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={draggable}
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={(instance) => {
              if (centeredRef.current) return;
              centeredRef.current = true;
              // Center viewport on n-hero (position -102,-4, ~374×400 card)
              setTimeout(() => {
                instance.setCenter(15, 8, { zoom: 0.85, duration: 0 });
              }, 80);
            }}
          >
            <Background
              id="diary-dots"
              variant={BackgroundVariant.Dots}
              gap={34}
              size={3.8}
              color="rgba(255, 220, 250, 0.22)"
            />
            <Controls />
          </ReactFlow>
        </div>
      )}
    </>
  );
}

export default App;