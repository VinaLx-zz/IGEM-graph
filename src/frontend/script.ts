/* tslint:disable:interface-name no-console no-var-requires space-before-function-paren no-reference*/
/// <reference path="./constants.ts" />

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

function DeleteLinksFromTopics<E extends d3.BaseType, PE extends d3.BaseType, PD>(
    nodes: d3.Selection<E, GraphNode, PE, PD>) {
    nodes.filter((d) => d.group === 0).each(function (d) {
        const p = (this as Node).parentNode as Node;
        const pp = p.parentNode as Node;
        pp.replaceChild(this as Node, p);
    });
}

type CommonSelect<D> = d3.Selection<d3.BaseType, D, d3.BaseType, {}>;

function EnableSVGTooltip() {
    $("circle").tooltip({
        animation: false,
        container: "body",
        placement: "top",
        trigger: "hover",
    });
}

class GraphVisualization {
    public svg: d3.Selection<HTMLElement, {}, null, undefined>;
    public simulation: d3.Simulation<GraphNode, GraphLink>;
    public params: Const.Params;

    constructor(svg: HTMLElement) {
        this.svg = d3.select(svg);
        this.simulation = InitForceSimulation(
            [this.SVGWidth() / 2, this.SVGHeight() / 2]);
        this.params = new Const.Params([this.SVGWidth(), this.SVGHeight()]);
    }

    public RequestAndDraw(): void {
        const url = this.svg.attr("config");
        d3.json(url, (error, json: InputJson) => {
            if (error) {
                throw error;
            }
            this.DrawForceGraph(InputJsonToGraph(json));
        });
    }

    private DrawForceGraph(graph: Graph): void {
        const links = this.GetLinkSelection(graph.links);
        const nodes = this.GetNodeSelection(graph.nodes);

        this.NodeHoverEffect(nodes, ElementAjacencyArray(nodes.size(), links));

        this.SetSimulationNodes(graph.nodes);
        this.SetSimulationLinks(graph.links);

        this.ConnectModelAndView(nodes, links);

        EnableSVGTooltip();
    }

    private GetLinkSelection(links: GraphLink[]) {
        const linkSelection = this.svg.append("g").attr("class", "links")
            .selectAll("line").data(links).enter()
            .append("line").attr("stroke-width", (d) => Math.sqrt(d.value));
        return linkSelection;
    }

    private GetNodeSelection(nodes: GraphNode[]) {
        const circleNode = this.svg.append("g").attr("class", "nodes")
            .selectAll("a").data(nodes).enter()
            .append("a").attr("href", (d) => d.url).attr("target", "_blank")
            .append("circle")
            .attr("r", this.params.nodeRadius)
            .attr("fill", (d) => Const.Color(d.group))
            .attr("data-toggle", "tooltip")
            .attr("title", (d) => d.name);

        this.InitNodeDrag(circleNode);
        DeleteLinksFromTopics(circleNode);
        return circleNode;
    }

    private NodeHoverEffect<E extends d3.BaseType, PE extends d3.BaseType, PD>(
        nodes: d3.Selection<E, GraphNode, PE, PD>, aa: E[][]) {
        const params = this.params;
        const nodeHoverRadius = params.nodeRadius * params.radiusExpand;
        nodes.on("mouseover", function (d) {
            d3.select(this)
                .transition()
                .duration(params.nodeTransDuration)
                .attr("r", nodeHoverRadius);
            d3.selectAll(aa[d.id])
                .transition()
                .duration(params.nodeTransDuration)
                .style("stroke", "#111")
                .style("stroke-width", "2px");
        }).on("mouseout", function (d) {
            d3.select(this)
                .transition()
                .duration(params.nodeTransDuration)
                .attr("r", params.nodeRadius);
            d3.selectAll(aa[d.id])
                .transition()
                .duration(params.nodeTransDuration)
                .style("stroke", "#999")
                .style("stroke-width", "1.5px");
        });
    }
    private InitNodeDrag<E extends d3.BaseType, PE extends d3.BaseType, PD>(
        node: d3.Selection<E, GraphNode, PE, PD>) {
        node.call(d3.drag<any, GraphNode>()
            .on("start", (d: GraphNode) => {
                if (!d3.event.active) {
                    this.simulation.alphaTarget(0.3).restart();
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
                    this.simulation.alphaTarget(0);
                }
                d.fx = null;
                d.fy = null;
            }));
    }

    private SetSimulationNodes(nodes: GraphNode[]) {
        this.simulation.nodes(nodes);
    }

    private SetSimulationLinks(links: GraphLink[]) {
        const linkForce =
            this.simulation.force<d3.ForceLink<GraphNode, GraphLink>>("link");
        if (linkForce === undefined) {
            console.error("get force simulation fail");
            return;
        }
        linkForce.links(links).distance(
            (l) => this.params.linkDistance / l.value);
    }

    private ConnectModelAndView(
        nodes: CommonSelect<GraphNode>, links: CommonSelect<GraphLink>) {
        this.simulation.on("tick", () => {
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

    private SVGWidth(): number {
        return Number(this.svg.attr("width"));
    }

    private SVGHeight(): number {
        return Number(this.svg.attr("height"));
    }
}

function CaptureSVGElemAndDraw() {
    new GraphVisualization($("svg.graph")[0]).RequestAndDraw();
}

CaptureSVGElemAndDraw();
