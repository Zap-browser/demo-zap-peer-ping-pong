import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import { toast } from "sonner"


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
      ping(id: string): unknown;
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
  const fgRef = useRef<ForceGraphMethods<Node, Link> | null>(null) as React.MutableRefObject<ForceGraphMethods<Node, Link> | undefined>;
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [ load, setLoad ] = useState(true);
  const [ errorType, setErrorType ] = useState<'noBtfs' | 'noPermissions' | null>(null);
  const [pingData, setPingData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  // const [peerId, setPeerId] = useState<string>('');
  const [currentPeerId, setCurrentPeerId] = useState< Node >({ id: '', type: 'peer' });

  async function handlePing() {
    setLoading(true)
    // console.log("Pinging peer:", currentPeerId.id);
    // const start = performance.now()
    const data: any = await window.btfs?.ping(currentPeerId.id);
    // console.log(data);
    if(data.success){
      setPingData(data.data);
    }else{
      toast.error("Error while pinging!!");
    }
    setLoading(false)
  }
  // console.log(loading);
 
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
        !window?.btfs?.permissions?.btfs?.children?.swarm?.children?.peers?.base ||
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
      setLoad(false);
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
      setTimeout(() => {
        fgRef.current?.cameraPosition(
          { x: 0, y: 0, z: 200 },  // Position of camera
          { x: 0, y: 0, z: 0 },    // Look-at point
          1000                     // Transition duration in ms
        );
      }, 500);
    };
    init();
  }, []);
  // console.log(errorType);
  return load ? (
    <div className="bg-black h-screen w-full flex justify-center items-center text-white">
      {errorType == null &&
        <div className="flex flex-col items-center justify-center gap-2">
          <h2 className="text-5xl font-mono">Configuring Peer Graph</h2>
          <p className="text-2xl font-mono">Please wait while the graph is being prepared.....</p>
        </div>
      }
      {errorType === 'noBtfs' && (
        <div className="text-red-500 flex flex-col items-center justify-center gap-2">
          <h2 className="text-5xl font-mono">Error: BTFS-injections is not available.</h2>
          <p className="text-2xl font-mono">Please ensure that you are on Zap-Browser</p>
        </div>
      )}
      {errorType === 'noPermissions' && (
        <div className="text-gray-500 flex flex-col items-center justify-center gap-2">
          <h2 className="text-5xl font-mono">Warning: BTFS-injections-Permissions are not enabled.</h2>
          <p className="text-2xl font-mono">Please ensure that you have provided the necessary permissions to this host.</p>
        </div>
      )}
    </div>):(
    <div className="md:flex items-center md:h-full">
    <Drawer open={open} onOpenChange={(value)=>{setOpen(value); setPingData(null)}}>
      <DrawerContent className="bg-white text-gray-900 shadow-xl border border-gray-200 rounded-t-xl">
        <div className="mx-auto w-full flex flex-col items-center max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-3xl text-white text-bold">{currentPeerId.id}</DrawerTitle>
            <DrawerDescription className="text-xl text-gray-400">{currentPeerId.type == 'self'? "Its You!!!" : "A Conneted peer." }</DrawerDescription>
          </DrawerHeader>

          <div className="flex items-center flex-col w-full space-y-4">

            { currentPeerId.type == "peer" && 
              <Button 
                onClick={handlePing} 
                className="border border-gray-900 hover:text-gray-900 hover:bg-white hover:border-3  text-white transition-all font-semibold py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? "Pinging..." : "Ping"}
              </Button>
            }

            {pingData !== null && (
              <div className="text-gray-800 font-mono text-sm mt-4 p-2 rounded bg-gray-100 w-full text-left border-1 border-gray-600 border-rounded-[4px]">
                <div className="mb-2 font-semibold text-gray-600">Ping Times:</div>
                <div className="flex flex-wrap gap-2">
                  {pingData.times.map((time: any, idx: number) => (
                    <span key={idx} className="bg-white border border-gray-300 px-2 py-1 rounded">{time} ms</span>
                  ))}
                </div>
                <div className="mt-3 font-semibold text-gray-600">
                  Average Response Time: <span className="text-gray-800">{pingData.average} ms</span>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="destructive" className="text-black border-white bg-[#10B981] border-3  w-[100px] text-bold text-lp-2">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
      <ForceGraph3D
        linkWidth={1}
        linkOpacity={0.7}
        graphData={graphData}
        nodeThreeObject={({ type }) => {
          const geometry =
          type === 'self' ? new THREE.BoxGeometry(10, 10, 10) : new THREE.SphereGeometry(5, 32, 32);
          
          // const material = new THREE.MeshLambertMaterial({
          //   color: type === 'self' ? 0xF3065E : 0xF6791C,
          //   transparent: true,
          //   opacity: 0.85
          // });
          
          const material = new THREE.MeshLambertMaterial({
            color: type === 'self' ? 0x000000 : 0x10B981, // indigo + emerald
            transparent: true,
            opacity: 0.9
          });

          return new THREE.Mesh(geometry, material);
        }}
        ref={fgRef}
        nodeLabel="id"
        backgroundColor="#807d7a"
        onNodeClick={(node) => {
          if (node.type === 'self') {
            // console.log(`You are connected as: ${node}`);
            setOpen(true);
            setCurrentPeerId(node);
          } else {
            // console.log(`Peer ID: ${node}`);
            setOpen(true);
            setCurrentPeerId(node);
          }
        }}
      />
    </div>
  );
};

export default Graph3DView;
