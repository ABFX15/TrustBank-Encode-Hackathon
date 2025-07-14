"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import * as d3 from "d3";
import { motion } from "framer-motion";
import { getUserTrustNetwork } from "@/lib/goldsky";

interface Node {
  id: string;
  name: string;
  trustScore: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  group: number;
  totalPayments?: number;
  totalVouches?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  type: "payment" | "vouch" | "loan";
}

interface NetworkData {
  nodes: Node[];
  links: Link[];
}

export function LiveTrustNetworkGraph() {
  const { address } = useAccount();
  const svgRef = useRef<SVGSVGElement>(null);
  const [networkData, setNetworkData] = useState<NetworkData>({
    nodes: [],
    links: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  useEffect(() => {
    if (address) {
      loadTrustNetworkData();
      // Set up real-time updates
      const interval = setInterval(loadTrustNetworkData, 15000);
      return () => clearInterval(interval);
    }
  }, [address]);

  useEffect(() => {
    if (networkData.nodes.length > 0 && svgRef.current) {
      createNetworkVisualization();
    }
  }, [networkData, animationSpeed]);

  const loadTrustNetworkData = async () => {
    if (!address) return;

    try {
      // Simulate comprehensive network data (in production, this would come from Goldsky)
      const mockNetworkData: NetworkData = {
        nodes: [
          {
            id: address,
            name: "You",
            trustScore: 247,
            group: 1,
            totalPayments: 23,
            totalVouches: 8,
          },
          {
            id: "0x1234567890123456789012345678901234567890",
            name: "Alice Thompson",
            trustScore: 189,
            group: 2,
            totalPayments: 15,
            totalVouches: 12,
          },
          {
            id: "0x2345678901234567890123456789012345678901",
            name: "Bob Wilson",
            trustScore: 234,
            group: 2,
            totalPayments: 28,
            totalVouches: 6,
          },
          {
            id: "0x3456789012345678901234567890123456789012",
            name: "Charlie Davis",
            trustScore: 156,
            group: 3,
            totalPayments: 9,
            totalVouches: 4,
          },
          {
            id: "0x4567890123456789012345678901234567890123",
            name: "Diana Chen",
            trustScore: 298,
            group: 2,
            totalPayments: 34,
            totalVouches: 15,
          },
          {
            id: "0x5678901234567890123456789012345678901234",
            name: "Eve Rodriguez",
            trustScore: 134,
            group: 3,
            totalPayments: 7,
            totalVouches: 2,
          },
          {
            id: "0x6789012345678901234567890123456789012345",
            name: "Frank Kim",
            trustScore: 276,
            group: 2,
            totalPayments: 31,
            totalVouches: 11,
          },
          {
            id: "0x7890123456789012345678901234567890123456",
            name: "Grace Lee",
            trustScore: 198,
            group: 3,
            totalPayments: 19,
            totalVouches: 7,
          },
        ],
        links: [
          {
            source: address,
            target: "0x1234567890123456789012345678901234567890",
            value: 150,
            type: "vouch",
          },
          {
            source: address,
            target: "0x2345678901234567890123456789012345678901",
            value: 75,
            type: "payment",
          },
          {
            source: address,
            target: "0x4567890123456789012345678901234567890123",
            value: 200,
            type: "vouch",
          },
          {
            source: "0x1234567890123456789012345678901234567890",
            target: "0x4567890123456789012345678901234567890123",
            value: 180,
            type: "vouch",
          },
          {
            source: "0x2345678901234567890123456789012345678901",
            target: "0x3456789012345678901234567890123456789012",
            value: 100,
            type: "payment",
          },
          {
            source: "0x4567890123456789012345678901234567890123",
            target: "0x5678901234567890123456789012345678901234",
            value: 50,
            type: "payment",
          },
          {
            source: "0x4567890123456789012345678901234567890123",
            target: "0x6789012345678901234567890123456789012345",
            value: 220,
            type: "vouch",
          },
          {
            source: "0x6789012345678901234567890123456789012345",
            target: "0x7890123456789012345678901234567890123456",
            value: 120,
            type: "payment",
          },
          {
            source: "0x1234567890123456789012345678901234567890",
            target: "0x7890123456789012345678901234567890123456",
            value: 90,
            type: "payment",
          },
          {
            source: "0x2345678901234567890123456789012345678901",
            target: "0x6789012345678901234567890123456789012345",
            value: 160,
            type: "vouch",
          },
        ],
      };

      setNetworkData(mockNetworkData);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load trust network data:", error);
      setIsLoading(false);
    }
  };

  const createNetworkVisualization = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("pointer-events", "none")
      .style("font-size", "12px");

    // Create simulation
    const simulation = d3
      .forceSimulation<Node>(networkData.nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(networkData.links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create gradients for links
    const defs = svg.append("defs");

    const vouchGradient = defs
      .append("linearGradient")
      .attr("id", "vouch-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    vouchGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#00d4ff");
    vouchGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#8b5cf6");

    const paymentGradient = defs
      .append("linearGradient")
      .attr("id", "payment-gradient")
      .attr("gradientUnits", "userSpaceOnUse");
    paymentGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#00ff88");
    paymentGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ffd93d");

    // Create links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(networkData.links)
      .enter()
      .append("line")
      .attr("stroke", (d) =>
        d.type === "vouch" ? "url(#vouch-gradient)" : "url(#payment-gradient)"
      )
      .attr("stroke-width", (d) => Math.sqrt(d.value / 10))
      .attr("stroke-opacity", 0.7)
      .style("pointer-events", "none");

    // Create link labels
    const linkLabels = svg
      .append("g")
      .selectAll("text")
      .data(networkData.links)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#999")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .text((d) => `${d.type}: $${d.value}`);

    // Create node groups
    const nodeGroup = svg
      .append("g")
      .selectAll("g")
      .data(networkData.nodes)
      .enter()
      .append("g")
      .call(
        d3
          .drag<SVGGElement, Node>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    // Create node circles
    const node = nodeGroup
      .append("circle")
      .attr("r", (d) => Math.max(15, d.trustScore / 10))
      .attr("fill", (d) => {
        if (d.id === address) return "#00d4ff";
        if (d.group === 2) return "#00ff88";
        return "#ff6b6b";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `
          <strong>${d.name}</strong><br/>
          Trust Score: ${d.trustScore}<br/>
          Payments: ${d.totalPayments}<br/>
          Vouches: ${d.totalVouches}
        `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");

        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", Math.max(20, d.trustScore / 8));
      })
      .on("mouseout", function (event, d) {
        tooltip.transition().duration(500).style("opacity", 0);

        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", Math.max(15, d.trustScore / 10));
      })
      .on("click", function (event, d) {
        setSelectedNode(d);
      });

    // Add node labels
    const labels = nodeGroup
      .append("text")
      .text((d) => d.name.split(" ")[0])
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("pointer-events", "none")
      .style("font-weight", "bold");

    // Add trust score badges
    const badges = nodeGroup
      .append("text")
      .text((d) => d.trustScore)
      .attr("font-size", "10px")
      .attr("fill", "#ffd93d")
      .attr("text-anchor", "middle")
      .attr("dy", "25px")
      .style("pointer-events", "none")
      .style("font-weight", "bold");

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      linkLabels
        .attr("x", (d) => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr("y", (d) => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 250) return "text-cyan-400";
    if (score >= 200) return "text-green-400";
    if (score >= 150) return "text-yellow-400";
    return "text-red-400";
  };

  const getNetworkStats = () => {
    const totalNodes = networkData.nodes.length;
    const totalConnections = networkData.links.length;
    const avgTrustScore =
      networkData.nodes.reduce((sum, node) => sum + node.trustScore, 0) /
      totalNodes;
    const vouchConnections = networkData.links.filter(
      (link) => link.type === "vouch"
    ).length;

    return {
      totalNodes,
      totalConnections,
      avgTrustScore: Math.round(avgTrustScore),
      vouchConnections,
    };
  };

  const stats = getNetworkStats();

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/20">
          <div className="text-2xl font-bold text-cyan-400">
            {stats.totalNodes}
          </div>
          <div className="text-sm text-gray-400">Network Nodes</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/20">
          <div className="text-2xl font-bold text-green-400">
            {stats.totalConnections}
          </div>
          <div className="text-sm text-gray-400">Total Connections</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/20">
          <div className="text-2xl font-bold text-purple-400">
            {stats.avgTrustScore}
          </div>
          <div className="text-sm text-gray-400">Avg Trust Score</div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-cyan-500/20">
          <div className="text-2xl font-bold text-yellow-400">
            {stats.vouchConnections}
          </div>
          <div className="text-sm text-gray-400">Vouch Links</div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-cyan-400">
              🌐 Live Trust Network Graph
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Live Updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-400">Speed:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) =>
                    setAnimationSpeed(parseFloat(e.target.value))
                  }
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <svg
              ref={svgRef}
              className="w-full border border-gray-700 rounded-lg bg-gray-900/30"
              style={{ height: "500px" }}
            />

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
              <div className="text-sm font-semibold text-cyan-400 mb-2">
                Legend
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-gray-300">You</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">High Trust</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-gray-300">Building Trust</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded"></div>
                  <span className="text-gray-300">Vouch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-gradient-to-r from-green-400 to-yellow-400 rounded"></div>
                  <span className="text-gray-300">Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Node Details Panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20"
            >
              <h4 className="text-lg font-semibold text-cyan-400 mb-4">
                Node Details
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">Name</div>
                  <div className="text-white font-medium">
                    {selectedNode.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Trust Score</div>
                  <div
                    className={`text-xl font-bold ${getTrustScoreColor(
                      selectedNode.trustScore
                    )}`}
                  >
                    {selectedNode.trustScore}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Payments</div>
                  <div className="text-green-400 font-medium">
                    {selectedNode.totalPayments}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Vouches</div>
                  <div className="text-purple-400 font-medium">
                    {selectedNode.totalVouches}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Address</div>
                  <div className="text-gray-300 font-mono text-xs">
                    {selectedNode.id.slice(0, 6)}...{selectedNode.id.slice(-4)}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
              <h4 className="text-lg font-semibold text-cyan-400 mb-4">
                Node Details
              </h4>
              <div className="text-gray-400 text-center py-8">
                Click on a node to view details
              </div>
            </div>
          )}

          {/* Network Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
            <h4 className="text-lg font-semibold text-cyan-400 mb-4">
              Network Actions
            </h4>
            <div className="space-y-3">
              <button
                onClick={loadTrustNetworkData}
                className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Refresh Network
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
