// product-assembly.component.ts
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
   width?: number;   // ✅ adăugat
  height?: number;  // ✅ adăugat
  
}

@Component({
  selector: 'app-product-assembly',
  templateUrl: './product-assembly.component.html',
  styleUrls: ['./product-assembly.component.css'],
  imports:[CommonModule]
})
export class ProductAssemblyComponent {
  @Output() completed = new EventEmitter<{
    rotations: number;
    componentsPlaced: { componentId: string; slotId: string }[];
  }>();

  currentSide: 'front' | 'back' = 'front';
  rotationCount = 0;
  draggedComponent: ComponentPiece | null = null;
  hoveredSlotId: string | null = null;
  placementError: string | null = null;
  lastDroppedId: string | null = null;



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
  // Top row
  { id: 'slot1', side: 'front', topPercent: 0.15, leftPercent: 0.60 },
  { id: 'slot2', side: 'front', topPercent: 0.15, leftPercent: 0.72 },
  { id: 'slot3', side: 'front', topPercent: 0.15, leftPercent: 0.84 },

  // Bottom row
  { id: 'slot4', side: 'front', topPercent: 0.70, leftPercent: 0.60 },
  { id: 'slot5', side: 'front', topPercent: 0.70, leftPercent: 0.72 },
  { id: 'slot6', side: 'front', topPercent: 0.70, leftPercent: 0.84 },

  // Cover slot (on back)
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

  // Reguli capac
  if (this.draggedComponent.id === 'cover' &&
      (slot.id !== 'slot-cover' || this.currentSide !== 'back')) {
    this.placementError = 'Cover must be placed on back in its designated slot.';
    return;
  }

  // Plasare componentă
  this.draggedComponent.placedIn = slot.id;
  slot.occupiedBy = this.draggedComponent.id;

  // 👉 Activează animație doar o dată
  this.lastDroppedId = this.draggedComponent.id;
  setTimeout(() => this.lastDroppedId = null, 400);

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

    const placements = this.components
      .filter(c => c.placedIn)
      .map(c => ({ componentId: c.id, slotId: c.placedIn! }));

    if (this.cover.placedIn) {
      placements.push({ componentId: this.cover.id, slotId: this.cover.placedIn });
    }

    this.completed.emit({
      rotations: this.rotationCount,
      componentsPlaced: placements
    });
  }
}
