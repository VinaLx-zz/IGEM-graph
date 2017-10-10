/* tslint:disable:interface-name no-console */
import * as d3 from "d3";

interface GraphLink {
    source: string;
    target: string;
    value: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    group: number;
}

interface Graph {
    nodes: GraphNode[];
    links: GraphLink[];
}

const svg = d3.select("svg");
const width = Number(svg.attr("width"));
const height = Number(svg.attr("height"));

const color = d3.scaleOrdinal(d3.schemeCategory20);

const simulation: any = d3.forceSimulation<GraphNode>()
    .force("link", d3.forceLink().id((d: any) => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2)) as d3.Simulation<GraphNode, GraphLink>;

d3.json("miserables.json", (error, graph: Graph) => {
    if (error) { throw error; }

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", (d: any) => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", (d: any) => color(d.group))
        .call(d3.drag<Element, GraphNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // node.append("title").text((d: any) => d.id);

    simulation.nodes(graph.nodes)
        .on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
            node
                .attr("cx", (d: GraphNode) => d.x)
                .attr("cy", (d: GraphNode) => d.y);
        });

    simulation.force/*<d3.ForceLink<{}, GraphLink>>*/("link").links(graph.links);

});

function dragstarted(d: GraphNode) {
    if (!d3.event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d: GraphNode) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d: GraphNode) {
    if (!d3.event.active) {
        simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
}
