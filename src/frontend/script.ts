/* tslint:disable:interface-name no-console no-var-requires space-before-function-paren */
import * as d3 from "d3";
import * as Const from "./constants";

type DirectSelect<E extends d3.BaseType> =
    d3.Selection<E, {}, HTMLElement, any>;

interface GraphLink {
    source: number;
    target: number;
    value: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
    id: number;
    url: string;
    name: string;
    group: number;
}

interface Graph {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface InputJson {
    nodes: Array<{ name: string, group: number, url: string }>;
    links: Array<{ source: number, target: number, value: number }>;
}

function InitForceSimulation([cx, cy]: [number, number]) {
    return d3.forceSimulation<GraphNode, GraphLink>()
        .force("link", d3.forceLink<GraphNode, GraphLink>().id((d) => String(d.id)))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(cx, cy));
}

function InputJsonToGraph(j: InputJson): Graph {
    const nodes = Array<GraphNode>();
    const links = j.links;
    for (let i = 0; i < j.nodes.length; ++i) {
        nodes.push({ ...j.nodes[i], id: i });
    }
    return { links, nodes };
}

function InitLinkSelection<E extends d3.BaseType>(
    selectedSVG: DirectSelect<E>, links: GraphLink[]) {
    const linkSelection = selectedSVG.append("g").attr("class", "links")
        .selectAll("line").data(links).enter()
        .append("line").attr("stroke-width", (d) => Math.sqrt(d.value));
    return linkSelection;
}

function ElementAjacencyArray<E extends d3.BaseType, PE extends d3.BaseType, PD>(
    n: number, links: d3.Selection<E, GraphLink, PE, PD>): E[][] {
    const graph = Array<E[]>();
    for (let i = 0; i < n; ++i) {
        graph.push(Array<E>());
    }
    links.each(function (d) {
        graph[d.source].push(this);
        graph[d.target].push(this);
    });
    return graph;
}

function InitNodeDrag<E extends d3.BaseType, PE extends d3.BaseType, PD>(
    node: d3.Selection<E, GraphNode, PE, PD>,
    sim: d3.Simulation<GraphNode, GraphLink>) {
    node.call(d3.drag<any, GraphNode>()
        .on("start", (d: GraphNode) => {
            if (!d3.event.active) {
                sim.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", (d: GraphNode) => {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        })
        .on("end", (d: GraphNode) => {
            if (!d3.event.active) {
                sim.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        }));
}

function InitNodeSelection<E extends d3.BaseType>(
    selectedSVG: DirectSelect<E>, sim: d3.Simulation<GraphNode, GraphLink>, nodes: GraphNode[]) {
    const circleNode = selectedSVG.append("g").attr("class", "nodes")
        .selectAll("a").data(nodes).enter()
        .append("a").attr("href", (d) => d.url).attr("target", "_blank")
        .append("circle")
        .attr("r", Const.kNodeRadius)
        .attr("fill", (d) => Const.Color(d.group))
        .attr("data-toggle", "tooltip")
        .attr("title", (d) => d.name);

    InitNodeDrag(circleNode, sim);
    DeleteLinksFromTopics(circleNode);
    return circleNode;
}

function DeleteLinksFromTopics<E extends d3.BaseType, PE extends d3.BaseType, PD>(
    nodes: d3.Selection<E, GraphNode, PE, PD>) {
    nodes.filter((d) => d.group === 0).each(function (d) {
        const p = (this as Node).parentNode as Node;
        const pp = p.parentNode as Node;
        pp.replaceChild(this as Node, p);
    });
}

function NodeHoverEffect<E extends d3.BaseType, PE extends d3.BaseType, PD>(
    nodes: d3.Selection<E, GraphNode, PE, PD>, aa: E[][]) {
    const nodeHoverRadius = Const.kNodeRadius * Const.kRadiusExpand;
    nodes.on("mouseover", function (d) {
        d3.select(this)
            .transition()
            .duration(Const.kNodeTransDuration)
            .attr("r", nodeHoverRadius);
        d3.selectAll(aa[d.id])
            .transition()
            .duration(Const.kNodeTransDuration)
            .style("stroke", "#111")
            .style("stroke-width", "2px");
    }).on("mouseout", function (d) {
        d3.select(this)
            .transition()
            .duration(Const.kNodeTransDuration)
            .attr("r", Const.kNodeRadius);
        d3.selectAll(aa[d.id])
            .transition()
            .duration(Const.kNodeTransDuration)
            .style("stroke", "#999")
            .style("stroke-width", "1.5px");
    });
}

function SetSimulationNodes(
    sim: d3.Simulation<GraphNode, GraphLink>, nodes: GraphNode[]): void {
    sim.nodes(nodes);
}

function SetSimulationLinks(
    sim: d3.Simulation<GraphNode, GraphLink>, links: GraphLink[]): void {
    const linkForce = sim.force<d3.ForceLink<GraphNode, GraphLink>>("link");
    if (linkForce === undefined) {
        console.error("get force simulation fail");
        return;
    }
    linkForce.links(links).distance((l) => Const.kLinkDistance / l.value);
}

type CommonSelect<D> = d3.Selection<d3.BaseType, D, d3.BaseType, {}>;

function ConnectModelAndView(
    sim: d3.Simulation<GraphNode, GraphLink>,
    nodes: CommonSelect<GraphNode>, links: CommonSelect<GraphLink>) {
    sim.on("tick", () => {
        links
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);
        nodes
            .attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);
    });
}

function DrawForceGraph<E extends d3.BaseType>(
    svg: DirectSelect<E>, simulation: d3.Simulation<GraphNode, GraphLink>, graph: Graph) {
    const links = InitLinkSelection(svg, graph.links);
    const nodes = InitNodeSelection(svg, simulation, graph.nodes);

    const ajacencyArray = ElementAjacencyArray(nodes.size(), links);

    NodeHoverEffect(nodes, ajacencyArray);

    SetSimulationNodes(simulation, graph.nodes);
    SetSimulationLinks(simulation, graph.links);

    ConnectModelAndView(simulation, nodes, links);

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

function CaptureSVGElemAndDraw() {
    const svg = d3.select("svg.graph");
    const [w, h] = [Number(svg.attr("width")), Number(svg.attr("height"))];
    const simulation = InitForceSimulation([w / 2, h / 2]);
    Const.InitSizes(w, h);
    d3.json(svg.attr("config"), (error, json: InputJson) => {
        if (error) {
            throw error;
        }
        DrawForceGraph(svg, simulation, InputJsonToGraph(json));
    });
}

CaptureSVGElemAndDraw();
