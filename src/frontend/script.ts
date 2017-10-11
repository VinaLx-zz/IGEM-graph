/* tslint:disable:interface-name no-console no-var-requires */
import * as d3 from "d3";

type DirectSelect<E extends d3.BaseType> =
    d3.Selection<E, {}, HTMLElement, any>;

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

console.log(d3.schemeCategory20);
const color = d3.scaleOrdinal(d3.schemeCategory20);

function InitForceSimulation([cx, cy]: [number, number]) {
    return d3.forceSimulation<GraphNode, GraphLink>()
        .force("link", d3.forceLink<GraphNode, GraphLink>().id((d) => d.name))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(cx, cy));
}

const simulation = InitForceSimulation([width / 2, height / 2]);

function InputJsonToGraph(j: InputJson): Graph {
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

function InitLinkSelection<E extends d3.BaseType>(
    selectedSVG: DirectSelect<E>, links: GraphLink[]) {
    return selectedSVG.append("g").attr("class", "links")
        .selectAll("line").data(links).enter()
        .append("line").attr("stroke-width", (d) => Math.sqrt(d.value));
}
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

function InitNodeSelection<E extends d3.BaseType>(
    selectedSVG: DirectSelect<E>, nodes: GraphNode[]) {
    const node = selectedSVG.append("g").attr("class", "nodes")
        .selectAll("circle")
        .data(nodes).enter()
        .append("a").attr("href", "http://www.example.com").attr("target", "_blank")
        .append("circle")
        .attr("r", 7).attr("fill", (d) => color(String(d.group)))
        .attr("data-toggle", "tooltip")
        .attr("title", (d) => d.name)
        .call(d3.drag<any, GraphNode>()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    node.append("title").text((d) => d.name);
    return node;
}

function SetSimulationNodes(
    sim: d3.Simulation<GraphNode, GraphLink>, nodes: GraphNode[]) {
    sim.nodes(nodes);
}

function SetSimulationLinks(
    sim: d3.Simulation<GraphNode, GraphLink>, links: GraphLink[]) {
    const linkForce = sim.force<d3.ForceLink<GraphNode, GraphLink>>("link");
    if (linkForce === undefined) {
        console.error("get force simulation fail");
        return;
    }
    linkForce.links(links).distance((l) => 50 / l.value);
}

function DrawForceGraph(graph: Graph) {
    const link = InitLinkSelection(svg, graph.links);

    const node = InitNodeSelection(svg, graph.nodes);

    SetSimulationNodes(simulation, graph.nodes);
    SetSimulationLinks(simulation, graph.links);

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


    EnableSVGTooltip();
}

function EnableSVGTooltip() {
    $("circle").tooltip({
        animation: false,
        container: "body",
        placement: "top",
        trigger: "hover",
    });
}

d3.json("graph2009.json", (error, json: InputJson) => {
    if (error) {
        throw error;
    }
    DrawForceGraph(InputJsonToGraph(json));
});
