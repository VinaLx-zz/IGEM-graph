/* tslint:disable:interface-name no-console */
import * as d3 from "d3";

interface GraphLink {
    source: string;
    target: string;
    value: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
    name: string;
    group: number;
}

interface Graph {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface InputJson {
    nodes: Array<{ name: string, group: number }>;
    links: Array<{ source: number, target: number, value: number }>;
}

const svg = d3.select("svg");
const width = Number(svg.attr("width"));
const height = Number(svg.attr("height"));

const color = d3.scaleOrdinal(d3.schemeCategory20);

const simulation: any = d3.forceSimulation<GraphNode>()
    .force("link", d3.forceLink().id((d: any) => d.name))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2)) as d3.Simulation<GraphNode, GraphLink>;

function fromInputJson(j: InputJson): Graph {
    const nodes = j.nodes as GraphNode[];
    const links = Array<GraphLink>();
    for (const { source, target, value } of j.links) {
        links.push({
            source: nodes[source].name,
            target: nodes[target].name,
            value,
        });
    }
    return { links, nodes };
}

d3.json("graph2009.json", (error, json: InputJson) => {
    if (error) {
        throw error;
    }
    const graph = fromInputJson(json);

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", (d) => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", (d) => color(String(d.group)))
        .call(d3.drag<Element, GraphNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title").text((d) => d.name);

    simulation.nodes(graph.nodes)
        .on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);
            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);
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
