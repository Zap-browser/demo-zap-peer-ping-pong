import { useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';


import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

// Extend the Window interface to include 'btfs'
declare global {
  interface Window {
    btfs: {
      swarm: any;
      refreshStats: () => void;
      stat?: { peerIdentity?: string };
      permissions?: {
        btfs?: {
          children?: {
            swarm?: {
              children?: {
                peers?: {
                  base?: boolean;
                };
              };
            };
            ping?: {
              base?: boolean;
            };
          };
        };
      };
    };
  }
}

function extractPeerId(str: string) {
  const match = str.match(/\/p2p\/([^/]+)/);
  return match ? match[1] : null;
}

type Node = { id: string; type: 'self' | 'peer' };
type Link = { source: string; target: string };

const Graph3DView = () => {
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [ errorType, setErrorType ] = useState<'noBtfs' | 'noPermissions' | null>(null);
  const [pingTime, setPingTime] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [peerId, setPeerId] = useState<string>('');
  const [currentPeerId, setCurrentPeerId] = useState< Node >({ id: '', type: 'peer' });

  async function handlePing() {
    setLoading(true)
    // const start = performance.now()
    
    // Replace this with actual ping logic (e.g., via BTFS API)
    // await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100)) // simulate delay
    
    // const end = performance.now()
    // setPingTime(Math.round(end - start))
    setLoading(false)
  }
 
  useEffect(() => {
    const init = async () => {
      // Check if the btfsd exists; if not, set error
      await new Promise(resolve => setTimeout(resolve, 500));
      // console.log('Checking for btfs...');
      if (!window.btfs) {
        setErrorType('noBtfs');
        // console.error('BTFS is not available.');
        return;
      }
      // Check for required permissions; if not present, set error
      if (
        !window?.btfs?.permissions?.btfs?.children?.swarm?.children?.peers?.base &&
        !window?.btfs?.permissions?.btfs?.children?.ping?.base
      ) {
        setErrorType('noPermissions');
        // console.error('BTFS does not have the required permissions to access swarm peers or ping.');
        return;
      }
      // now i can go there
      if (window.btfs?.refreshStats) {
        window.btfs.refreshStats();
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadGraph();
      setLoading(false);
    };

    const loadGraph = async () => {
      const selfId = window.btfs.stat?.peerIdentity || 'SELF_NODE';
      const connections = await window.btfs?.swarm?.peers();
      // console.log(connections);
      const peerIds = connections.map(extractPeerId).filter(Boolean) as string[];
      // console.log('Peer IDs:', peerIds);
      const nodes: Node[] = [
        { id: selfId, type: 'self' },
        ...peerIds.map((id: string) => ({ id, type: 'peer' as const }))
      ];

      const links: Link[] = peerIds.map(id => ({
        source: id,
        target: selfId
      }));
      // console.log('Graph data:', { nodes, links });
      setGraphData({ nodes, links });
    };
    init();
  }, []);

  return (
  //   <div style={{ textAlign: 'center', marginTop: '20px' }}>
  //     <h2>Loading Graph...</h2>
  //     <p>Please wait while the graph is being prepared.</p>
  //   </div>
    <div className="md:flex items-center md:h-full">
    <Drawer open={open} onOpenChange={(value)=>{setOpen(value); setPingTime(null)}}>
      <DrawerContent className="bg-gray-900 border-black text-white">
        <div className="mx-auto w-full flex flex-col items-center max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-3xl text-white text-bold">{currentPeerId.id}</DrawerTitle>
            <DrawerDescription className="text-xl text-gray-400">{currentPeerId.type == 'self'? "Its You!!!" : "A Conneted peer." }</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 flex items-center flex-col space-y-4">

            <Button onClick={handlePing} className="bg-black border-white border-3 hover:bg-white w-[100px] hover:text-black text-bold text-lp-2" disabled={loading}>
              {loading ? "Pinging..." : "Ping"}
            </Button>

            {pingTime !== null && (
              <div className="text-green-600 font-mono">
                Ping Time: {pingTime} ms
              </div>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="destructive" className="text-black border-white border-3  w-[100px] text-bold text-lp-2">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
      <ForceGraph3D
        graphData={graphData}
        nodeThreeObject={({ type }) => {
          const geometry =
          type === 'self' ? new THREE.BoxGeometry(10, 10, 10) : new THREE.SphereGeometry(5, 32, 32);
          
          const material = new THREE.MeshLambertMaterial({
            color: type === 'self' ? 0xF3065E : 0xF6791C,
            transparent: true,
            opacity: 0.85
          });
          
          return new THREE.Mesh(geometry, material);
        }}
        nodeLabel="id"
        backgroundColor="#2a0a4f"
        onNodeClick={(node) => {
          if (node.type === 'self') {
            console.log(`You are connected as: ${node}`);
            setOpen(true);
            setCurrentPeerId(node);
          } else {
            console.log(`Peer ID: ${node}`);
            setOpen(true);
            setCurrentPeerId(node);
          }
        }}
      />
    </div>
  );
};

export default Graph3DView;
