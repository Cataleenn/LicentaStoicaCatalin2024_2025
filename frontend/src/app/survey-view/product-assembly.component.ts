// ✅ product-assembly.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ComponentPiece {
  id: string;
  name: string;
  color: string;
  required: boolean;
  placedIn?: string;
}

interface Slot {
  id: string;
  side: 'front' | 'back';
  topPercent: number;
  leftPercent: number;
  occupiedBy?: string;
  width?: number;
  height?: number;
}

@Component({
  selector: 'app-product-assembly',
  templateUrl: './product-assembly.component.html',
  styleUrls: ['./product-assembly.component.css'],
  imports: [CommonModule]
})
export class ProductAssemblyComponent {
  @Output() completed = new EventEmitter<{
    rotations: number;
    componentsPlaced: { componentId: string; slotId: string; order: number}[];
  }>();

  currentSide: 'front' | 'back' = 'front';
  rotationCount = 0;
  draggedComponent: ComponentPiece | null = null;
  hoveredSlotId: string | null = null;
  placementError: string | null = null;
  lastDroppedId: string | null = null;
  stepCounter = 1;
  placementOrder: { componentId: string; slotId: string; order: number}[] = [];

  components: ComponentPiece[] = [
    { id: 'blue-1', name: 'Blue 1', color: '#42a5f5', required: true },
    { id: 'blue-2', name: 'Blue 2', color: '#42a5f5', required: true },
    { id: 'white-1', name: 'White 1', color: '#ffffff', required: true },
    { id: 'white-2', name: 'White 2', color: '#ffffff', required: true },
    { id: 'pink-1', name: 'Pink 1', color: '#ec407a', required: true },
    { id: 'pink-2', name: 'Pink 2', color: '#ec407a', required: true }
  ];

  cover: ComponentPiece = { id: 'cover', name: 'Cover', color: '#ffffff', required: true };

  slots: Slot[] = [
    { id: 'slot1', side: 'front', topPercent: 0.15, leftPercent: 0.60 },
    { id: 'slot2', side: 'front', topPercent: 0.15, leftPercent: 0.72 },
    { id: 'slot3', side: 'front', topPercent: 0.15, leftPercent: 0.84 },
    { id: 'slot4', side: 'front', topPercent: 0.70, leftPercent: 0.60 },
    { id: 'slot5', side: 'front', topPercent: 0.70, leftPercent: 0.72 },
    { id: 'slot6', side: 'front', topPercent: 0.70, leftPercent: 0.84 },
    {
      id: 'slot-cover',
      side: 'back',
      topPercent: 0.5,
      leftPercent: 0.5,
      width: 200,
      height: 100
    }
  ];

  get visibleSlots(): Slot[] {
    return this.slots.filter(s => s.side === this.currentSide);
  }

  rotateBoard() {
    this.currentSide = this.currentSide === 'front' ? 'back' : 'front';
    this.rotationCount++;
  }

  onDragStart(component: ComponentPiece) {
    this.draggedComponent = component;
  }

  onDrop(slot: Slot) {
  if (!this.draggedComponent) return;

  // ✅ Validare pentru capac
  if (slot.id === 'slot-cover') {
    if (this.draggedComponent.id !== 'cover' || this.currentSide !== 'back') {
      this.placementError = 'Only the Cover can be placed in the designated back slot.';
      return;
    }
  }

  if (this.draggedComponent.id === 'cover' &&
      (slot.id !== 'slot-cover' || this.currentSide !== 'back')) {
    this.placementError = 'Cover must be placed on back in its designated slot.';
    return;
  }

  // ✅ Marchează piesa ca plasată în slot
  this.draggedComponent.placedIn = slot.id;
  slot.occupiedBy = this.draggedComponent.id;

  // ✅ Elimină orice înregistrare anterioară cu aceeași componentă
  this.placementOrder = this.placementOrder.filter(
    p => p.componentId !== this.draggedComponent!.id
  );

  // ✅ Adaugă noua plasare la finalul ordinii
  this.placementOrder.push({
    componentId: this.draggedComponent.id,
    slotId: slot.id,
    order: 0, // temporar, va fi reindexat
  
  });

  // ✅ Recalculează ordinea 1..N după noua poziționare
  this.placementOrder = this.placementOrder.map((item, index) => ({
    ...item,
    order: index + 1
  }));

  // 🔄 UX vizual
  this.lastDroppedId = this.draggedComponent.id;
  setTimeout(() => this.lastDroppedId = null, 400);

  // 🧹 Cleanup
  this.draggedComponent = null;
  this.placementError = null;
}


  allowDrop(event: DragEvent, slot?: Slot) {
    event.preventDefault();
  }

  getSlotPosition(slotId?: string) {
    const slot = this.slots.find(s => s.id === slotId);
    return slot ? {
      top: slot.topPercent * 100 + '%',
      left: slot.leftPercent * 100 + '%'
    } : {};
  }

  getComponentInSlot(slotId: string): ComponentPiece | undefined {
    return [...this.components, this.cover].find(c => c.placedIn === slotId);
  }

  isAssemblyValid(): boolean {
    const allPlaced = this.components.every(c => c.placedIn);
    const coverPlacedCorrectly = this.cover.placedIn === 'slot-cover';
    return allPlaced && coverPlacedCorrectly;
  }

  submitAssembly() {
    if (!this.isAssemblyValid()) {
      alert('Assembly is incomplete. Please place all components correctly.');
      return;
    }

    this.completed.emit({
      rotations: this.rotationCount,
      componentsPlaced: this.placementOrder
    });
  }
}