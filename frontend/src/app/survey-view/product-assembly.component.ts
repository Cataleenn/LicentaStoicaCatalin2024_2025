// ✅ product-assembly.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ComponentPiece {
  id: string;
  name: string;
  color: string;
  image?: string; // Path to PNG image for slots (front view)
  poolImage?: string; // Path to PNG image for pool (perspective view)
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

  // Updated component names and colors to reflect real functionality
  components: ComponentPiece[] = [
    { 
      id: 'bluetooth-1', 
      name: 'Bluetooth 1', 
      color: '#1976d2', 
      image: 'assets/components/bluetooth-module-front.png',
      poolImage: 'assets/components/bluetooth-module-pool.png',
      required: true 
    },
    { 
      id: 'bluetooth-2', 
      name: 'Bluetooth 2', 
      color: '#1976d2', 
      image: 'assets/components/bluetooth-module-front.png',
      poolImage: 'assets/components/bluetooth-module-pool.png',
      required: true 
    },
    { 
      id: 'powerbank-1', 
      name: 'Powerbank 1', 
      color: '#ffffff', 
      image: 'assets/components/powerbank-module-front.png',
      poolImage: 'assets/components/powerbank-module-pool.png',
      required: true 
    },
    { 
      id: 'powerbank-2', 
      name: 'Powerbank 2', 
      color: '#ffffff', 
      image: 'assets/components/powerbank-module-front.png',
      poolImage: 'assets/components/powerbank-module-pool.png',
      required: true 
    },
    { 
      id: 'flash-1', 
      name: 'Flash 1', 
      color: '#ec407a', 
      image: 'assets/components/flash-module-front.png',
      poolImage: 'assets/components/flash-module-pool.png',
      required: true 
    },
    { 
      id: 'flash-2', 
      name: 'Flash 2', 
      color: '#ec407a', 
      image: 'assets/components/flash-module-front.png',
      poolImage: 'assets/components/flash-module-pool.png',
      required: true 
    }
  ];

  // Screen instead of Cover
  screen: ComponentPiece = { 
    id: 'screen', 
    name: 'Screen', 
    color: '#424242', 
    image: 'assets/components/screen.png',
    poolImage: 'assets/components/screen.png',
    required: true 
  };

  // Hub slots remain the same - the hub is the board itself (front and back)
  slots: Slot[] = [
    // Front side of the hub - 6 slots for modules
    { id: 'hub-front-slot1', side: 'front', topPercent: 0.15, leftPercent: 0.60 },
    { id: 'hub-front-slot2', side: 'front', topPercent: 0.15, leftPercent: 0.72 },
    { id: 'hub-front-slot3', side: 'front', topPercent: 0.15, leftPercent: 0.84 },
    { id: 'hub-front-slot4', side: 'front', topPercent: 0.70, leftPercent: 0.60 }, // Bottom row
    { id: 'hub-front-slot5', side: 'front', topPercent: 0.70, leftPercent: 0.72 }, // Bottom row
    { id: 'hub-front-slot6', side: 'front', topPercent: 0.70, leftPercent: 0.84 }, // Bottom row
    // Back side of the hub - 1 slot for screen
    {
      id: 'hub-back-screen-slot',
      side: 'back',
      topPercent: 0.5,
      leftPercent: 0.5,
      width: 50,
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
  
  get frontSlots(): Slot[] {
    return this.slots.filter(s => s.side === 'front');
  }

  get backSlots(): Slot[] {
    return this.slots.filter(s => s.side === 'back');
  }

  onDrop(slot: Slot) {
    if (!this.draggedComponent) return;

    // Validation for screen - can only be placed on back side in screen slot
    if (slot.id === 'hub-back-screen-slot') {
      if (this.draggedComponent.id !== 'screen' || this.currentSide !== 'back') {
        this.placementError = 'Only the Screen can be placed in the designated back slot of the hub.';
        return;
      }
    }

    // Screen can only go to the back screen slot
    if (this.draggedComponent.id === 'screen' &&
        (slot.id !== 'hub-back-screen-slot' || this.currentSide !== 'back')) {
      this.placementError = 'Screen must be placed on the back side of the hub in its designated slot.';
      return;
    }

    // Modules (bluetooth, powerbank, flash) can only go to front slots
    if (this.draggedComponent.id !== 'screen' && slot.side === 'back') {
      this.placementError = 'Modules can only be placed on the front side of the hub.';
      return;
    }

    const previousSlotId = this.draggedComponent.placedIn;

    // Handle slot swapping if needed
    if (slot.occupiedBy) {
      const existing = this.getComponentById(slot.occupiedBy);

      if (existing) {
        if (previousSlotId) {
          const previousSlot = this.slots.find(s => s.id === previousSlotId);
          if (previousSlot) {
            this.moveComponentToSlot(existing, previousSlot);
          } else {
            existing.placedIn = undefined;
            slot.occupiedBy = undefined;
          }
        } else {
          existing.placedIn = undefined;
          slot.occupiedBy = undefined;
        }
      }
    }

    this.moveComponentToSlot(this.draggedComponent, slot);

    // Update placement order
    this.placementOrder = this.placementOrder.filter(
      p => p.componentId !== this.draggedComponent!.id
    );

    this.placementOrder.push({
      componentId: this.draggedComponent.id,
      slotId: slot.id,
      order: 0
    });

    this.placementOrder = this.placementOrder.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    this.lastDroppedId = this.draggedComponent.id;
    setTimeout(() => (this.lastDroppedId = null), 400);

    this.draggedComponent = null;
    this.placementError = null;
  }

  private moveComponentToSlot(component: ComponentPiece, slot: Slot) {
    // 1. Free previous slot if component was already placed
    const currentSlot = this.slots.find(s => s.occupiedBy === component.id);
    if (currentSlot) {
      currentSlot.occupiedBy = undefined;
    }

    // 2. Mark new position
    component.placedIn = slot.id;
    slot.occupiedBy = component.id;

    // 3. Update placementOrder (remove any old entry)
    this.placementOrder = this.placementOrder.filter(
      p => p.componentId !== component.id
    );

    // 4. Add component to end of order (will be reindexed)
    this.placementOrder.push({
      componentId: component.id,
      slotId: slot.id,
      order: 0
    });

    // 5. Recalculate order 1..N
    this.placementOrder = this.placementOrder.map((item, index) => ({
      ...item,
      order: index + 1
    }));
  }

  onDragEnd(event: DragEvent) {
    // If component was taken from a slot but not dropped in another
    if (this.draggedComponent && this.draggedComponent.placedIn) {
      const slot = this.slots.find(s => s.occupiedBy === this.draggedComponent!.id);

      // If user didn't drop (component remains "floating")
      if (slot) {
        slot.occupiedBy = undefined;
        this.draggedComponent.placedIn = undefined;
      }
    }

    // Cleanup anyway
    this.draggedComponent = null;
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
    return [...this.components, this.screen].find(c => c.placedIn === slotId);
  }

  getComponentById(id: string): ComponentPiece | undefined {
    return [...this.components, this.screen].find(c => c.id === id);
  }

  // Helper method to determine if component is flash type
  isFlashComponent(componentId: string): boolean {
    return componentId.includes('flash');
  }

  // Helper method to determine if slot is on bottom row
  isBottomRowSlot(slotId: string): boolean {
    return ['hub-front-slot4', 'hub-front-slot5', 'hub-front-slot6'].includes(slotId);
  }

  isAssemblyValid(): boolean {
    const allModulesPlaced = this.components.every(c => c.placedIn);
    const screenPlacedCorrectly = this.screen.placedIn === 'hub-back-screen-slot';
    return allModulesPlaced && screenPlacedCorrectly;
  }

  submitAssembly() {
    if (!this.isAssemblyValid()) {
      alert('Assembly is incomplete. Please place all modules on the front of the hub and the screen on the back of the hub.');
      return;
    }

    this.completed.emit({
      rotations: this.rotationCount,
      componentsPlaced: this.placementOrder
    });
  }
}