import './CirclePack.css';

import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';

import { MIP } from '../../types';
import { IModel, IVariableNode } from './Container';

interface IProps {
  layout?: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>;
  handleSelectVariable: (
    node: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>
  ) => void;
  model: IModel;
  selectedVariable: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum> | undefined;
}

interface INodeSelection
  extends d3.Selection<
    Element | d3.EnterElement | Document | Window | SVGCircleElement | null,
    d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>,
    SVGGElement,
    {}
  > {}

type IView = [number, number, number];

export default ({
  layout,
  handleSelectVariable,
  model,
  selectedVariable
}: IProps) => {
  const [loaded, setLoaded] = useState(false);
  // const [root, setRoot] = useState<
  //   d3.HierarchyCircularNode<MIP.Internal.IVariableDatum> | undefined
  // >(undefined);
  const [selectedNode, setSelectedNode] = useState<
    d3.HierarchyCircularNode<MIP.Internal.IVariableDatum> | undefined
  >(undefined);
  const gRef = useRef<SVGSVGElement>(null);
  const dRef = useRef<HTMLDivElement>(null);
  const svgRef = gRef.current;
  const shortcutsRef = dRef.current;

  const diameter: number = 800;
  const padding: number = 1.5;
  //
  let view: [number, number, number];
  let focus: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>;
  let node: INodeSelection;
  let label: INodeSelection;
  let color: d3.ScaleLinear<string, string>;
  // const bubbleLayout = d3
  //   .pack<MIP.Internal.IVariableDatum>()
  //   .size([diameter, diameter])
  //   .padding(padding);

  useEffect(() => {
    // if (hierarchyNode && !root) {
    //   setRoot(bubbleLayout(hierarchyNode));
    // }

    if (layout && !loaded) {
      setLoaded(true);
      d3Render();
    }

    if (selectedVariable) {
      // console.log(d3.event)
      // zoom(selectedVariable);
    }

    // if (layout) {
    //   console.log('useEffect');
    //   d3.select(svgRef)
    //     .selectAll('circle')
    //     .data(layout.descendants())
    //     .attr('class', d => {
    //       if (
    //         model.variable !== undefined &&
    //         model.variable.data.code === d.data.code
    //       ) {
    //         return 'node variable';
    //       } else if (
    //         model.covariables !== undefined &&
    //         model.covariables.map(c => c.data.code).includes(d.data.code)
    //       ) {
    //         return 'node covariable';
    //       } else if (
    //         model.covariables !== undefined &&
    //         model.covariables.map(c => c.data.code).includes(d.data.code)
    //       ) {
    //         return 'node grouping';
    //       }

    //       return 'node';
    //     });
    // }
  }, [layout]);

  const depth = (
    n: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>
  ): number =>
    n.children ? 1 + (d3.max<number>(n.children.map(depth)) || 0) : 1;

  // interactive functions
  const zoomTo = (v: IView) => {
    const k = diameter / v[2];
    view = v;

    label.attr(
      'transform',
      d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr(
      'transform',
      d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr('r', d => d.r * k);
  };

  const zoom = (
    circleNode:
      | d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>
      | undefined
  ) => {
    if (!circleNode) {
      return;
    }
    handleSelectVariable(circleNode);

    console.log(d3.event)
    console.log(circleNode.x, circleNode.y, circleNode.r)

    focus = circleNode;

    // reduce zoom if it's a leaf node
    const targetView: IView = circleNode.children
      ? [focus.x, focus.y, focus.r * 2 + padding]
      : [focus.x, focus.y, focus.r * 3 + padding];
    const transition = d3
      .transition<d3.BaseType>()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween('zoom', () => {
        const i = d3.interpolateZoom(view, targetView);

        return (t: number) => zoomTo(i(t));
      });

    const shouldDisplay = (
      dd: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>,
      ffocus: d3.HierarchyCircularNode<MIP.Internal.IVariableDatum>
    ): boolean => dd.parent === ffocus || !ffocus.children; // || !dd.children;

    // Revert all nodes fill color
    // console.log('zoom');
    node
      .transition()
      .duration(500)
      .style('fill', d => (d.children ? color(d.depth) : 'white'));

    node
      .filter(d => d !== layout && d.data.code === circleNode.data.code)
      .transition()
      .duration(250)
      .style('fill', '#8C9AA2');

    label
      .filter(function(dd) {
        const el = this as HTMLElement;
        return (
          shouldDisplay(dd, focus) ||
          (el && el.style && el.style.display === 'inline')
        );
      })
      .transition(transition as any)
      .style('fill-opacity', dd => (shouldDisplay(dd, focus) ? 1 : 0))
      .on('start', function(dd) {
        const el = this as HTMLElement;
        if (shouldDisplay(dd, focus)) {
          el.style.display = 'inline';
          shouldDisplay(dd, focus);
        }
      });
  };

  const d3Render = () => {

    console.log(layout)
    if (!layout) {
      return;
    }

    if (svgRef && layout) {
      // Layout
      // setRoot(bubbleLayout(hierarchyNode))
      console.log('d3Render')
      color = d3
        .scaleLinear<string, string>()
        .domain([0, depth(layout)])
        .range(['hsl(190,80%,80%)', 'hsl(228,80%,40%)'])
        .interpolate(d3.interpolateHcl);

      const svg = d3
        .select(svgRef)
        .attr('width', diameter)
        .attr('height', diameter)
        .attr(
          'viewBox',
          `-${diameter / 2} -${diameter / 2} ${diameter} ${diameter}`
        )
        .style('margin', '0 -8px')
        .style('width', 'calc(100% + 16px)')
        .style('height', 'auto')
        .style('cursor', 'pointer')
        .on('click', () => zoom(layout));

      node = svg
        .append('g')
        .selectAll('circle')
        .data(layout.descendants())
        .join('circle')
        .attr('class', 'node')
        .attr('fill', d => (d.children ? color(d.depth) : 'white'))
        .on('click', d => focus !== d && (zoom(d), d3.event.stopPropagation()));

      svg
        .selectAll('circle')
        .data(layout.descendants())
        .append('title')
        .text(
          d =>
            `${d.data.label}\n${d.data.description ? d.data.description : ''}`
        );

      const maxLength = 12;
      label = svg
        .append('g')
        .selectAll('text')
        .data(layout.descendants())
        .join('text')
        .attr('class', 'label')
        .style('fill-opacity', d => (d.parent === layout ? 1 : 0))
        .style('display', d => (d.parent === layout ? 'inline' : 'none'))
        .text(d =>
          d.data.label.length > maxLength
            ? d.data.label
                .split(' ')
                .reduce(
                  (acc: string, p: string) =>
                    acc.length < maxLength ? `${acc} ${p}` : `${acc}`,
                  ''
                ) + '...'
            : d.data.label
        );

      focus = layout;
      zoomTo([layout.x, layout.y, layout.r * 2]);

      d3.select(shortcutsRef)
        .selectAll('.shortcut')
        .data(layout.descendants())
        .join('a')
        .style('fill-opacity', d => (d.parent === layout ? 1 : 0))
        .style('display', d => (d.parent === layout ? 'inline' : 'none'))
        .text(d => d.data.label)
        .on('click', d => {
          zoom(d);
        });
    }
  };

  return (
    <div>
      <h6>Shortcuts</h6>
      <div ref={dRef} />
      <svg ref={gRef} />
    </div>
  );
};
