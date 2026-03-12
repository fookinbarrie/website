import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

import PasswordPage from './PasswordPage';
import NyanCursor from './NyanCursor';
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
import ScrapBackgroundSpawner from './ScrapBackgroundSpawner';
import { initialNodes, initialEdges } from './initialData';
import { useAudioControl } from './AudioControlContext';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

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

  // ReactFlow is mounted ONLY after game ends (password phase onward).
  // During the asteroid game: NOT mounted → zero event bleed-through.
  // After game win: mounted silently behind password UI → smooth reveal on transition.
  const [scrapbookReady, setScrapbookReady] = useState(false);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Cheat codes
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    const buf = { current: '' };
    const onKey = (e) => {
      if (e.key.length !== 1) return;
      buf.current = (buf.current + e.key.toLowerCase()).slice(-5);
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
      if (buf.current.endsWith('open')) {
        setDraggable(true);
        alert('🔓 Node dragging unlocked!');
        buf.current = '';
      }
      if (buf.current.endsWith('kocak')) {
        buf.current = '';
        setScrapbookReady(true);
        unlock();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlock]);

  const onInit = useCallback((instance) => {
    if (centeredRef.current) return;
    centeredRef.current = true;
    setTimeout(() => instance.setCenter(15, 8, { zoom: 0.85, duration: 0 }), 80);
  }, []);

  return (
    <>
      {/* Scrapbook – only mount after game is done so it can't steal events during gameplay */}
      {(scrapbookReady || isUnlocked) && (
        <div
          className="w-screen h-screen theme-darkpink"
          style={{ 
            pointerEvents: isUnlocked ? 'auto' : 'none',
            opacity: (scrapbookReady || isUnlocked) ? 1 : 0,
            transition: 'opacity 2s ease-in-out',
            transitionDelay: '1s', // Start fading in at second 1 of transition
            position: 'absolute',
            inset: 0,
            zIndex: 5
          }}
        >
          {isUnlocked && <NyanCursor />}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={isUnlocked ? draggable : false}
            defaultEdgeOptions={defaultEdgeOptions}
            onInit={onInit}
            panOnDrag={isUnlocked}
            panOnScroll={false}
            zoomOnScroll={isUnlocked}
            zoomOnPinch={isUnlocked}
            zoomOnDoubleClick={false}
            selectionOnDrag={false}
            preventScrolling={isUnlocked}
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
          <ScrapBackgroundSpawner active={isUnlocked} />
        </div>
      )}

      {/* Password overlay – fixed on top, fades away during transition */}
      {!isUnlocked && (
        <PasswordPage
          onUnlock={unlock}
          onGameComplete={() => setScrapbookReady(true)}
        />
      )}
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default App;