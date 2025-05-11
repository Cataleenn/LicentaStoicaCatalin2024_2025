import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentAssemblyComponent } from './component-assembly.component';

describe('ComponentAssemblyComponent', () => {
  let component: ComponentAssemblyComponent;
  let fixture: ComponentFixture<ComponentAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentAssemblyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponentAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
