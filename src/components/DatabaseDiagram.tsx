import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Key, Link } from 'lucide-react';

const TableNode = ({ data }: { data: any }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-300 min-w-[250px] overflow-hidden font-sans text-sm">
      <div className="bg-slate-800 text-white px-4 py-2 font-bold flex items-center justify-between">
        <span>{data.label}</span>
        <span className="text-xs bg-slate-600 px-2 py-0.5 rounded-full">Table</span>
      </div>
      <div className="flex flex-col">
        {data.columns.map((col: any, index: number) => (
          <div
            key={col.name}
            className={`flex items-center justify-between px-4 py-2 border-b border-slate-100 relative ${
              col.isPk ? 'bg-amber-50' : col.isFk ? 'bg-blue-50' : ''
            }`}
          >
            {/* Left Handle for FKs coming in */}
            <Handle
              type="target"
              position={Position.Left}
              id={col.name}
              style={{ top: '50%', background: '#94a3b8', border: 'none', width: 8, height: 8, left: -4 }}
            />

            <div className="flex items-center gap-2">
              {col.isPk && <Key className="w-3.5 h-3.5 text-amber-500" />}
              {col.isFk && <Link className="w-3.5 h-3.5 text-blue-500" />}
              {!col.isPk && !col.isFk && <div className="w-3.5 h-3.5" />}
              <span className={`font-medium ${col.isPk ? 'text-amber-700' : col.isFk ? 'text-blue-700' : 'text-slate-700'}`}>
                {col.name}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{col.type}</span>

            {/* Right Handle for PKs going out */}
            <Handle
              type="source"
              position={Position.Right}
              id={col.name}
              style={{ top: '50%', background: '#94a3b8', border: 'none', width: 8, height: 8, right: -4 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

const initialNodes: Node[] = [
  {
    id: 'users',
    type: 'table',
    position: { x: 50, y: 50 },
    data: {
      label: 'Users',
      columns: [
        { name: 'uid', type: 'string', isPk: true },
        { name: 'email', type: 'string' },
        { name: 'displayName', type: 'string' },
        { name: 'role', type: 'string' },
      ],
    },
  },
  {
    id: 'schools',
    type: 'table',
    position: { x: 400, y: 50 },
    data: {
      label: 'Schools',
      columns: [
        { name: 'id', type: 'string', isPk: true },
        { name: 'userId', type: 'string', isFk: true },
        { name: 'name', type: 'string' },
        { name: 'color', type: 'string' },
      ],
    },
  },
  {
    id: 'courses',
    type: 'table',
    position: { x: 750, y: 50 },
    data: {
      label: 'Courses',
      columns: [
        { name: 'id', type: 'string', isPk: true },
        { name: 'schoolId', type: 'string', isFk: true },
        { name: 'userId', type: 'string', isFk: true },
        { name: 'name', type: 'string' },
        { name: 'level', type: 'string' },
      ],
    },
  },
  {
    id: 'schedules',
    type: 'table',
    position: { x: 400, y: 350 },
    data: {
      label: 'Schedules',
      columns: [
        { name: 'id', type: 'string', isPk: true },
        { name: 'courseId', type: 'string', isFk: true },
        { name: 'schoolId', type: 'string', isFk: true },
        { name: 'userId', type: 'string', isFk: true },
        { name: 'grade', type: 'string' },
        { name: 'dayOfWeek', type: 'number' },
      ],
    },
  },
  {
    id: 'sessions',
    type: 'table',
    position: { x: 750, y: 350 },
    data: {
      label: 'Sessions',
      columns: [
        { name: 'id', type: 'string', isPk: true },
        { name: 'scheduleId', type: 'string', isFk: true },
        { name: 'courseId', type: 'string', isFk: true },
        { name: 'schoolId', type: 'string', isFk: true },
        { name: 'userId', type: 'string', isFk: true },
        { name: 'title', type: 'string' },
        { name: 'date', type: 'string' },
      ],
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-users-schools',
    source: 'users',
    sourceHandle: 'uid',
    target: 'schools',
    targetHandle: 'userId',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
  {
    id: 'e-schools-courses',
    source: 'schools',
    sourceHandle: 'id',
    target: 'courses',
    targetHandle: 'schoolId',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
  {
    id: 'e-courses-schedules',
    source: 'courses',
    sourceHandle: 'id',
    target: 'schedules',
    targetHandle: 'courseId',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
  {
    id: 'e-schedules-sessions',
    source: 'schedules',
    sourceHandle: 'id',
    target: 'sessions',
    targetHandle: 'scheduleId',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
];

export default function DatabaseDiagram() {
  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
