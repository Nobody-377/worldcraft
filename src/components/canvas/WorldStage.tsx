"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import type Konva from "konva";
import type { CanvasElement } from "@/types/worldcraft";

export interface WorldStageHandle {
  exportPng: (pixelRatio?: number) => string | null;
}

interface CanvasImageProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onTransformEnd: (
    id: string,
    attrs: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
  ) => void;
  registerNode: (id: string, node: Konva.Image | null) => void;
}

function CanvasImageItem({
  element,
  onSelect,
  onDragEnd,
  onTransformEnd,
  registerNode,
}: CanvasImageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const imageRef = useRef<Konva.Image | null>(null);

  useEffect(() => {
    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = element.previewUrl;
    img.onload = () => {
      if (isMounted) {
        setImage(img);
      }
    };
    return () => {
      isMounted = false;
    };
  }, [element.previewUrl]);

  const handleRef = useCallback(
    (node: Konva.Image | null) => {
      imageRef.current = node;
      registerNode(element.id, node);
    },
    [element.id, registerNode]
  );

  if (!image) return null;

  return (
    <KonvaImage
      id={element.id}
      ref={handleRef}
      image={image}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(element.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(element.id);
      }}
      onDragEnd={(e) => {
        onDragEnd(element.id, e.target.x(), e.target.y());
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onTransformEnd(element.id, {
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

interface WorldStageProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onTransformEnd: (
    id: string,
    attrs: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }
  ) => void;
  onDropFromInventory?: (itemId: string, x: number, y: number) => void;
}

const WorldStage = forwardRef<WorldStageHandle, WorldStageProps>(
  function WorldStage(
    {
      elements,
      selectedId,
      onSelect,
      onElementMove,
      onTransformEnd,
      onDropFromInventory,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const nodeMapRef = useRef<Map<string, Konva.Image>>(new Map());
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          setDimensions({
            width: Math.max(clientWidth, 280),
            height: Math.max(clientHeight, 320),
          });
        }
      };

      updateSize();
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    const registerNode = useCallback((id: string, node: Konva.Image | null) => {
      if (node) {
        nodeMapRef.current.set(id, node);
      } else {
        nodeMapRef.current.delete(id);
      }
    }, []);

    // Expose high-resolution PNG export via imperative handle
    useImperativeHandle(ref, () => ({
      exportPng: (pixelRatio = 2) => {
        if (!stageRef.current) return null;

        // Temporarily detach transformer handles so they don't appear in the downloaded PNG
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
          transformerRef.current.getLayer()?.batchDraw();
        }

        const dataUrl = stageRef.current.toDataURL({ pixelRatio });

        // Restore transformer handles if an element was selected
        if (selectedId && transformerRef.current) {
          const selectedNode = nodeMapRef.current.get(selectedId);
          if (selectedNode) {
            transformerRef.current.nodes([selectedNode]);
            transformerRef.current.getLayer()?.batchDraw();
          }
        }

        return dataUrl;
      },
    }));

    // Synchronize Transformer selection handles with active node
    useEffect(() => {
      if (!transformerRef.current) return;

      if (selectedId) {
        const selectedNode = nodeMapRef.current.get(selectedId);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
          return;
        }
      }
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }, [selectedId, elements]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData("application/worldcraft-item-id");
      if (!itemId || !onDropFromInventory || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      onDropFromInventory(itemId, dropX, dropY);
    };

    return (
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative w-full h-full min-h-[320px] overflow-hidden"
      >
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={(e) => {
            // Deselect when clicking on empty stage area
            if (e.target === e.target.getStage()) {
              onSelect(null);
            }
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) {
              onSelect(null);
            }
          }}
          className="cursor-default"
        >
          <Layer>
            {elements.map((el) => (
              <CanvasImageItem
                key={el.id}
                element={el}
                isSelected={el.id === selectedId}
                onSelect={onSelect}
                onDragEnd={onElementMove}
                onTransformEnd={onTransformEnd}
                registerNode={registerNode}
              />
            ))}

            {/* Retro Arcade Transformer with Arcade Yellow anchors & Dark Outlines */}
            <Transformer
              ref={transformerRef}
              keepRatio={true}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              rotateEnabled={true}
              anchorSize={11}
              anchorCornerRadius={2}
              borderStroke="#171D1B"
              borderStrokeWidth={2}
              borderDash={[4, 4]}
              anchorStroke="#171D1B"
              anchorStrokeWidth={2}
              anchorFill="#F5BD2D"
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 16 || Math.abs(newBox.height) < 16) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>
    );
  }
);

export default WorldStage;
