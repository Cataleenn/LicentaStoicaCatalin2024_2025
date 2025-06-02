// ✅ product-assembly.component.ts - STRICT placement restrictions
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ComponentPiece {
  id: string;
  name: string;
  color: string;
  image?: string;
  poolImage?: string;
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

interface AssemblyStatistics {
  rotations: number;
  componentsPlaced: { componentId: string; slotId: string; order: number}[];
  piecesRemovedCount: number;
  piecesSwappedCount: number;
  wrongPlacementsCount: number; // Doar pentru încălcările restricțiilor STRICTE
  correctPlacementsCount: number; // Module în sloturile potrivite pentru tipul lor
  optimalPlacementsCount: number; // Perfect placement în configurația ideală
  correctnessPercentage: number;
  totalMoves: number;
  timeSpent: number;
  detailedStats: {
    screenPlacement: 'correct' | 'wrong' | 'missing';
    powerbanksCorrect: number;
    bluetoothsCorrect: number;
    flashsCorrect: number;
    moduleTypeMismatches: Array<{componentId: string, slotId: string, expectedSlots: string[]}>;
  };
}

@Component({
  selector: 'app-product-assembly',
  templateUrl: './product-assembly.component.html',
  styleUrls: ['./product-assembly.component.css'],
  imports: [CommonModule]
})
export class ProductAssemblyComponent {
  @Output() completed = new EventEmitter<AssemblyStatistics>();

  currentSide: 'front' | 'back' = 'front';
  rotationCount = 0;
  draggedComponent: ComponentPiece | null = null;
  hoveredSlotId: string | null = null;
  placementError: string | null = null;
  lastDroppedId: string | null = null;
  stepCounter = 1;
  placementOrder: { componentId: string; slotId: string; order: number}[] = [];

  // ✅ Statistical tracking
  private startTime: number = Date.now();
  private piecesRemovedCount = 0;
  private piecesSwappedCount = 0;
  private wrongPlacementsCount = 0; // Doar pentru încălcările restricțiilor STRICTE
  private totalMoves = 0;
  private moveHistory: Array<{
    componentId: string;
    fromSlot?: string;
    toSlot?: string;
    timestamp: number;
    isValidPlacement: boolean; // Respectă restricțiile STRICTE
    isOptimal: boolean; // Este în slotul ideal pentru tipul său
  }> = [];

  // ✅ Configurația IDEALĂ (pentru statistici)
  private readonly OPTIMAL_ASSEMBLY = {
    'powerbank-1': 'hub-front-slot1',
    'powerbank-2': 'hub-front-slot5', 
    'flash-1': 'hub-front-slot2',
    'flash-2': 'hub-front-slot6',
    'bluetooth-1': 'hub-front-slot3',
    'bluetooth-2': 'hub-front-slot4',
    'screen': 'hub-back-screen-slot'
  };

  // ✅ Sloturile CORECTE pentru fiecare tip (pentru statistici)
  private readonly CORRECT_SLOTS_BY_TYPE = {
    powerbank: ['hub-front-slot1', 'hub-front-slot5'],
    flash: ['hub-front-slot2', 'hub-front-slot6'],
    bluetooth: ['hub-front-slot3', 'hub-front-slot4'],
    screen: ['hub-back-screen-slot']
  };

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

  screen: ComponentPiece = { 
    id: 'screen', 
    name: 'Screen', 
    color: '#424242', 
    image: 'assets/components/screen.png',
    poolImage: 'assets/components/screen.png',
    required: true 
  };

  slots: Slot[] = [
    { id: 'hub-front-slot1', side: 'front', topPercent: 0.15, leftPercent: 0.60 },
    { id: 'hub-front-slot2', side: 'front', topPercent: 0.15, leftPercent: 0.72 },
    { id: 'hub-front-slot3', side: 'front', topPercent: 0.15, leftPercent: 0.84 },
    { id: 'hub-front-slot4', side: 'front', topPercent: 0.70, leftPercent: 0.60 },
    { id: 'hub-front-slot5', side: 'front', topPercent: 0.70, leftPercent: 0.72 },
    { id: 'hub-front-slot6', side: 'front', topPercent: 0.70, leftPercent: 0.84 },
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

  get frontSlots(): Slot[] {
    return this.slots.filter(s => s.side === 'front');
  }

  get backSlots(): Slot[] {
    return this.slots.filter(s => s.side === 'back');
  }

  // ✅ Helper functions
  private getModuleType(componentId: string): string {
    if (componentId.includes('bluetooth')) return 'bluetooth';
    if (componentId.includes('powerbank')) return 'powerbank';
    if (componentId.includes('flash')) return 'flash';
    if (componentId === 'screen') return 'screen';
    return 'unknown';
  }

  // ✅ STRICT VALIDATION: Verifică dacă plasarea respectă restricțiile OBLIGATORII
  private isValidPlacement(componentId: string, slotId: string): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return false;

    // ✅ RESTRICȚII STRICTE - NU PERMITE PLASAREA GREȘITĂ
    if (componentId === 'screen') {
      return slot.side === 'back'; // Screen DOAR pe spate
    } else {
      return slot.side === 'front'; // Module DOAR pe față
    }
  }

  private isCorrectTypeSlot(componentId: string, slotId: string): boolean {
    const moduleType = this.getModuleType(componentId);
    const correctSlots = this.CORRECT_SLOTS_BY_TYPE[moduleType as keyof typeof this.CORRECT_SLOTS_BY_TYPE];
    return correctSlots ? correctSlots.includes(slotId) : false;
  }

  private isOptimalPlacement(componentId: string, slotId: string): boolean {
    return this.OPTIMAL_ASSEMBLY[componentId as keyof typeof this.OPTIMAL_ASSEMBLY] === slotId;
  }

  rotateBoard() {
    this.currentSide = this.currentSide === 'front' ? 'back' : 'front';
    this.rotationCount++;
  }

  onDragStart(component: ComponentPiece) {
    this.draggedComponent = component;
    
    if (component.placedIn) {
      this.piecesRemovedCount++;
    }
  }

  onDrop(slot: Slot) {
    if (!this.draggedComponent) return;

    // ✅ VERIFICARE RESTRICȚII STRICTE - BLOCHEAZĂ PLASAREA GREȘITĂ
    const isValidPlacement = this.isValidPlacement(this.draggedComponent.id, slot.id);
    
    if (!isValidPlacement) {
      // ✅ BLOCHEAZĂ PLASAREA ȘI AFIȘEAZĂ EROARE
      if (this.draggedComponent.id === 'screen' && slot.side === 'front') {
        this.placementError = '❌ Ecranul poate fi plasat DOAR pe partea din spate!';
      } else if (this.draggedComponent.id !== 'screen' && slot.side === 'back') {
        this.placementError = '❌ Modulele pot fi plasate DOAR pe partea din față!';
      }
      
      // ✅ Contorizează încălcarea restricțiilor STRICTE
      this.wrongPlacementsCount++;
      
      // ✅ RESETEAZĂ draggedComponent pentru a anula plasarea
      this.draggedComponent = null;
      
      // ✅ Ascunde eroarea după 3 secunde
      setTimeout(() => {
        this.placementError = null;
      }, 3000);
      
      // ✅ NU PERMITE PLASAREA - IEȘI DIN FUNCȚIE
      return;
    }

    // ✅ PLASAREA ESTE VALIDĂ - CONTINUĂ
    this.placementError = null; // Curăță orice eroare anterioară
    
    // ✅ VERIFICARE TIP CORECT (pentru statistici)
    const isCorrectTypeSlot = this.isCorrectTypeSlot(this.draggedComponent.id, slot.id);
    const isOptimal = this.isOptimalPlacement(this.draggedComponent.id, slot.id);

    const previousSlotId = this.draggedComponent.placedIn;

    // Handle swapping
    if (slot.occupiedBy) {
      const existing = this.getComponentById(slot.occupiedBy);

      if (existing) {
        if (previousSlotId) {
          const previousSlot = this.slots.find(s => s.id === previousSlotId);
          if (previousSlot) {
            this.moveComponentToSlot(existing, previousSlot);
            this.piecesSwappedCount++;
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

    // ✅ EFECTUEAZĂ PLASAREA (acum că știm că este validă)
    this.moveComponentToSlot(this.draggedComponent, slot);

    // ✅ Înregistrează statistici
    this.recordMove(this.draggedComponent.id, previousSlotId, slot.id, isValidPlacement, isOptimal);
    this.totalMoves++;

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
  }

  private recordMove(componentId: string, fromSlot?: string, toSlot?: string, isValidPlacement: boolean = false, isOptimal: boolean = false) {
    this.moveHistory.push({
      componentId,
      fromSlot,
      toSlot,
      timestamp: Date.now(),
      isValidPlacement,
      isOptimal
    });
  }

  private calculateDetailedStats() {
    const stats = {
      screenPlacement: 'missing' as 'correct' | 'wrong' | 'missing',
      powerbanksCorrect: 0,
      bluetoothsCorrect: 0,
      flashsCorrect: 0,
      moduleTypeMismatches: [] as Array<{componentId: string, slotId: string, expectedSlots: string[]}>
    };

    // Screen placement
    if (this.screen.placedIn) {
      stats.screenPlacement = this.screen.placedIn === 'hub-back-screen-slot' ? 'correct' : 'wrong';
    }

    // Module placements
    [...this.components].forEach(component => {
      if (component.placedIn) {
        const moduleType = this.getModuleType(component.id);
        const isInCorrectSlot = this.isCorrectTypeSlot(component.id, component.placedIn);
        
        if (isInCorrectSlot) {
          if (moduleType === 'powerbank') stats.powerbanksCorrect++;
          if (moduleType === 'bluetooth') stats.bluetoothsCorrect++;
          if (moduleType === 'flash') stats.flashsCorrect++;
        } else {
          const expectedSlots = this.CORRECT_SLOTS_BY_TYPE[moduleType as keyof typeof this.CORRECT_SLOTS_BY_TYPE] || [];
          stats.moduleTypeMismatches.push({
            componentId: component.id,
            slotId: component.placedIn,
            expectedSlots
          });
        }
      }
    });

    return stats;
  }

  private calculateCorrectnessPercentage(): number {
    const totalComponents = [...this.components, this.screen].length;
    let correctPlacements = 0;

    // Screen
    if (this.screen.placedIn === 'hub-back-screen-slot') {
      correctPlacements++;
    }

    // Modules in correct type slots
    this.components.forEach(component => {
      if (component.placedIn && this.isCorrectTypeSlot(component.id, component.placedIn)) {
        correctPlacements++;
      }
    });

    return Math.round((correctPlacements / totalComponents) * 100);
  }

  private moveComponentToSlot(component: ComponentPiece, slot: Slot) {
    const currentSlot = this.slots.find(s => s.occupiedBy === component.id);
    if (currentSlot) {
      currentSlot.occupiedBy = undefined;
    }

    component.placedIn = slot.id;
    slot.occupiedBy = component.id;

    this.placementOrder = this.placementOrder.filter(
      p => p.componentId !== component.id
    );

    this.placementOrder.push({
      componentId: component.id,
      slotId: slot.id,
      order: 0
    });

    this.placementOrder = this.placementOrder.map((item, index) => ({
      ...item,
      order: index + 1
    }));
  }

  onDragEnd(event: DragEvent) {
    if (this.draggedComponent && this.draggedComponent.placedIn) {
      const slot = this.slots.find(s => s.occupiedBy === this.draggedComponent!.id);

      if (slot) {
        slot.occupiedBy = undefined;
        this.draggedComponent.placedIn = undefined;
      }
    }

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

  isFlashComponent(componentId: string): boolean {
    return componentId.includes('flash');
  }

  isBottomRowSlot(slotId: string): boolean {
    return ['hub-front-slot4', 'hub-front-slot5', 'hub-front-slot6'].includes(slotId);
  }

  getAssemblyProgress(): number {
    const totalComponents = this.components.length + 1;
    const placedComponents = this.components.filter(c => c.placedIn).length + (this.screen.placedIn ? 1 : 0);
    return Math.round((placedComponents / totalComponents) * 100);
  }

  getProgressStatus(): string {
    const placedCount = this.components.filter(c => c.placedIn).length + (this.screen.placedIn ? 1 : 0);
    const totalCount = this.components.length + 1;
    return `${placedCount}/${totalCount} components placed`;
  }

  isAssemblyValid(): boolean {
    // ✅ Verifică că toate componentele sunt plasate ȘI că sunt în pozițiile CORECTE
    const allPlaced = [...this.components, this.screen].every(c => c.placedIn);
    
    if (!allPlaced) return false;
    
    // ✅ Verifică că toate componentele respectă restricțiile STRICTE
    const allValidPlacements = [...this.components, this.screen].every(c => 
      c.placedIn ? this.isValidPlacement(c.id, c.placedIn) : false
    );
    
    return allValidPlacements;
  }

  submitAssembly() {
    if (!this.isAssemblyValid()) {
      alert('Te rugăm să plasezi toate componentele în pozițiile corecte înainte de a trimite asamblarea.\n\n' +
            '• Ecranul trebuie plasat pe partea din spate\n' +
            '• Modulele trebuie plasate pe partea din față');
      return;
    }

    const endTime = Date.now();
    const timeSpent = Math.round((endTime - this.startTime) / 1000);
    const detailedStats = this.calculateDetailedStats();

    const correctPlacementsCount = detailedStats.powerbanksCorrect + detailedStats.bluetoothsCorrect + 
                                 detailedStats.flashsCorrect + (detailedStats.screenPlacement === 'correct' ? 1 : 0);

    const optimalPlacementsCount = [...this.components, this.screen].filter(c => 
      c.placedIn && this.isOptimalPlacement(c.id, c.placedIn)
    ).length;

    const statistics: AssemblyStatistics = {
      rotations: this.rotationCount,
      componentsPlaced: this.placementOrder,
      piecesRemovedCount: this.piecesRemovedCount,
      piecesSwappedCount: this.piecesSwappedCount,
      wrongPlacementsCount: this.wrongPlacementsCount, // Doar încălcările restricțiilor STRICTE
      correctPlacementsCount,
      optimalPlacementsCount,
      correctnessPercentage: this.calculateCorrectnessPercentage(),
      totalMoves: this.totalMoves,
      timeSpent: timeSpent,
      detailedStats
    };

    console.log('📊 Complete Assembly Statistics (with STRICT rules):', {
      ...statistics,
      summary: {
        'Strict rule violations (blocked)': this.wrongPlacementsCount,
        'Correct type placements': correctPlacementsCount + '/7',
        'Perfect/optimal placements': optimalPlacementsCount + '/7',
        'Overall correctness': statistics.correctnessPercentage + '%'
      },
      moveHistory: this.moveHistory
    });

    this.completed.emit(statistics);
  }
}