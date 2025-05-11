// product-assembly.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

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
  allowedComponents: string[];
  occupiedBy?: string;
}

@Component({
  selector: 'app-product-assembly',
  templateUrl: './product-assembly.component.html',
  styleUrls: ['./product-assembly.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProductAssemblyComponent {
  @Output() completed = new EventEmitter<{
    rotations: number;
    componentsPlaced: { componentId: string; slotId: string }[];
  }>();

  currentSide: 'front' | 'back' = 'front';
  rotationCount = 0;
  draggedComponent: ComponentPiece | null = null;

  components: ComponentPiece[] = [
    { id: 'pink-1', name: 'Pink 1', color: '#f48fb1', required: true },
    { id: 'pink-2', name: 'Pink 2', color: '#f48fb1', required: true },
    { id: 'white-1', name: 'White 1', color: '#ffffff', required: true },
    { id: 'white-2', name: 'White 2', color: '#ffffff', required: true },
    { id: 'blue-1', name: 'Blue 1', color: '#90caf9', required: true },
    { id: 'blue-2', name: 'Blue 2', color: '#90caf9', required: true }
  ];

  cover: ComponentPiece = { id: 'cover', name: 'White Cover', color: '#ffffff', required: true };

  slots: Slot[] = [
    { id: 'slot1', side: 'front', topPercent: 0.2, leftPercent: 0.2, allowedComponents: ['pink-1'] },
    { id: 'slot2', side: 'front', topPercent: 0.4, leftPercent: 0.2, allowedComponents: ['pink-2'] },
    { id: 'slot3', side: 'front', topPercent: 0.6, leftPercent: 0.2, allowedComponents: ['white-1'] },
    { id: 'slot4', side: 'front', topPercent: 0.8, leftPercent: 0.2, allowedComponents: ['white-2'] },
    { id: 'slot5', side: 'front', topPercent: 0.3, leftPercent: 0.6, allowedComponents: ['blue-1'] },
    { id: 'slot6', side: 'front', topPercent: 0.5, leftPercent: 0.6, allowedComponents: ['blue-2'] },
    { id: 'slot-cover', side: 'back', topPercent: 0.5, leftPercent: 0.5, allowedComponents: ['cover'] }
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
    if (!this.draggedComponent || !slot.allowedComponents.includes(this.draggedComponent.id)) {
      alert('This component cannot be placed here or on this side.');
      return;
    }

    if (this.draggedComponent.id === 'cover' && this.currentSide !== 'back') {
      alert('The cover can only be placed on the back.');
      return;
    }

    this.draggedComponent.placedIn = slot.id;
    slot.occupiedBy = this.draggedComponent.id;
    this.draggedComponent = null;
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  getSlotPosition(slotId?: string) {
    const slot = this.slots.find(s => s.id === slotId);
    return slot ? {
      top: slot.topPercent * 100 + '%',
      left: slot.leftPercent * 100 + '%'
    } : {};
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